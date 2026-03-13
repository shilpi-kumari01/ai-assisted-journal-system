# Architecture Decisions

## Scaling to 100k Users

### Database Scaling
- **Migrate from SQLite to PostgreSQL**: SQLite is file-based and not suitable for concurrent writes at scale. PostgreSQL can handle high concurrency and provides better indexing, partitioning, and replication.
- **Database Sharding**: Partition data by userId ranges to distribute load across multiple database instances.
- **Read Replicas**: Implement read replicas for insights and entry fetching to reduce load on the primary database.

### Application Scaling
- **Microservices Architecture**: Split into separate services:
  - Journal Service (CRUD operations)
  - Analysis Service (LLM processing)
  - Insights Service (aggregations)
  - User Service (authentication/authorization)
- **Load Balancing**: Use a load balancer (e.g., AWS ALB, NGINX) to distribute traffic across multiple application instances.
- **Horizontal Scaling**: Deploy on Kubernetes or serverless platforms (Vercel, AWS Lambda) for automatic scaling.

### Caching Layer
- **Redis**: Implement Redis for caching frequently accessed data like user insights and recent entries.
- **CDN**: Use CDN for static assets and API responses.

### Monitoring and Optimization
- **Database Indexing**: Add indexes on userId, createdAt, and emotion fields.
- **Query Optimization**: Use database query optimization and pagination for large result sets.
- **Background Processing**: Move LLM analysis to background jobs using tools like Bull.js or AWS SQS.

## Reducing LLM Cost

### Cost Optimization Strategies
- **Batch Processing**: Analyze multiple entries in batches rather than individually to reduce API calls.
- **Model Optimization**: Use smaller, more efficient models or fine-tune models on journal-specific data.
- **Caching**: Cache analysis results for identical or similar text inputs.
- **Rate Limiting**: Implement intelligent rate limiting based on user activity patterns.
- **Free Tier Management**: Use multiple free API keys or services with rotation.

### Alternative Approaches
- **On-Premise Models**: Deploy smaller models locally using tools like Ollama or Hugging Face Transformers.
- **Hybrid Approach**: Use free models for basic analysis and paid models only for complex cases.
- **Text Analysis Libraries**: Supplement with rule-based emotion detection for common patterns.

## Caching Repeated Analysis

### Implementation Strategy
- **Database Caching**: Store analysis results in SQLite `analysis_cache` table
- **Hash-based Lookup**: Generate SHA-256 hash of input text for cache key
- **Cache Structure**:
  ```sql
  CREATE TABLE analysis_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text_hash TEXT UNIQUE NOT NULL,
    text TEXT NOT NULL,
    emotion TEXT NOT NULL,
    keywords TEXT NOT NULL,
    summary TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```
- **Cache Logic**:
  1. Hash input text
  2. Check if hash exists in cache
  3. If found, return cached result
  4. If not, perform analysis and store in cache
- **Cache Invalidation**: No explicit invalidation (cache persists), but can be cleared manually

### Benefits
- Reduces API calls to Hugging Face
- Faster response times for repeated texts
- Cost savings on LLM usage
```typescript
// Example cache implementation
const cacheKey = crypto.createHash('sha256').update(text).digest('hex');
const cached = await redis.get(`analysis:${cacheKey}`);
if (cached) return JSON.parse(cached);

// Perform analysis
const result = await analyzeText(text);
await redis.setex(`analysis:${cacheKey}`, 2592000, JSON.stringify(result)); // 30 days
return result;
```

### Cache Management
- **LRU Eviction**: Use Redis LRU policy for memory management.
- **Cache Warming**: Pre-analyze common phrases or user patterns.
- **Monitoring**: Track cache hit rates and adjust TTL accordingly.

## Protecting Sensitive Journal Data

### Security Measures
- **Encryption at Rest**: Encrypt database files and backups using AES-256.
- **Encryption in Transit**: Use HTTPS/TLS 1.3 for all communications.
- **Data Minimization**: Only store necessary data and implement data retention policies.
- **Access Controls**: Implement role-based access control (RBAC) and principle of least privilege.

### Authentication & Authorization
- **JWT Tokens**: Use JSON Web Tokens with short expiration times.
- **Multi-Factor Authentication**: Require MFA for sensitive operations.
- **API Key Management**: Rotate API keys regularly and use environment-specific keys.

### Privacy Protections
- **GDPR Compliance**: Implement data deletion, portability, and consent management.
- **Anonymization**: Remove personally identifiable information from logs and analytics.
- **Audit Logging**: Maintain detailed logs of data access without storing sensitive content.

### Infrastructure Security
- **Network Security**: Use VPCs, security groups, and WAF to protect against attacks.
- **Regular Security Audits**: Conduct penetration testing and vulnerability assessments.
- **Backup Security**: Encrypt backups and store in secure, geographically distributed locations.

### Additional Safeguards
- **Rate Limiting**: Prevent abuse and DoS attacks.
- **Input Validation**: Sanitize all inputs to prevent injection attacks.
- **Zero-Trust Architecture**: Verify every request regardless of source.