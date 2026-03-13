'use client';

import { useState, useEffect } from 'react';
import { Brain, BookOpen, BarChart3, Sparkles } from 'lucide-react';

interface JournalEntry {
  id: number;
  userId: string;
  ambience: string;
  text: string;
  emotion?: string;
  keywords?: string;
  summary?: string;
  createdAt: string;
}

interface Insights {
  totalEntries: number;
  topEmotion: string | null;
  mostUsedAmbience: string | null;
  recentKeywords: string[];
}

interface AnalysisResult {
  emotion: string;
  keywords: string[];
  summary: string;
}

export default function Home() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [form, setForm] = useState({ ambience: 'forest', text: '' });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const userId = '123';

  useEffect(() => {
    fetchEntries();
    fetchInsights();
  }, []);

  const fetchEntries = async () => {
    const res = await fetch(`/api/journal/${userId}`);
    const data = await res.json();
    setEntries(data);
  };

  const fetchInsights = async () => {
    const res = await fetch(`/api/journal/insights/${userId}`);
    const data = await res.json();
    setInsights(data);
  };

  const handleAnalyze = async () => {
    if (!form.text.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/journal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.text }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      console.error(error);
    }
    setAnalyzing(false);
  };

  const handleSave = async () => {
    if (!analysis) return;
    setLoading(true);
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...form, ...analysis }),
    });
    if (res.ok) {
      setForm({ ambience: 'forest', text: '' });
      setAnalysis(null);
      fetchEntries();
      fetchInsights();
    }
    setLoading(false);
  };

  const getEmotionColor = (emotion: string | null | undefined) => {
    if (!emotion) return 'bg-gray-200 text-gray-900';
    switch (emotion.toLowerCase()) {
      case 'calm': return 'bg-green-200 text-green-900';
      case 'happy': return 'bg-yellow-200 text-yellow-900';
      case 'sad': return 'bg-blue-200 text-blue-900';
      case 'angry': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-200 text-gray-900';
    }
  };

  const getEmotionEmoji = (emotion: string | null | undefined) => {
    if (!emotion) return '😐';
    switch (emotion.toLowerCase()) {
      case 'calm': return '😌';
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      default: return '😐';
    }
  };

  const getAmbienceEmoji = (ambience: string) => {
    switch (ambience.toLowerCase()) {
      case 'forest': return '🌲';
      case 'ocean': return '🌊';
      case 'mountain': return '🏔️';
      default: return '🏞️';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-gray-300 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black flex items-center justify-center gap-2">
            <Brain className="w-10 h-10 text-blue-600" />
            AI-Assisted Journal
          </h1>
          <p className="text-gray-800 mt-2">Analyze your emotions and track your mental wellness journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* New Entry Card */}
          <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              New Journal Entry
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Ambience</label>
                <select
                  value={form.ambience}
                  onChange={(e) => setForm({ ...form, ambience: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  title="Select ambience"
                >
                  <option value="forest">🌲 Forest</option>
                  <option value="ocean">🌊 Ocean</option>
                  <option value="mountain">🏔️ Mountain</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">Journal Text</label>
                <textarea
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-600 text-black"
                  placeholder="Write about your thoughts and feelings..."
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || !form.text.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing emotion...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Analyze Emotion
                  </>
                )}
              </button>

              {analysis && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold mb-3 text-blue-900">Analysis Result:</h3>
                  <div className="space-y-2">
                    <p><strong className="text-gray-900">Emotion:</strong> <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEmotionColor(analysis.emotion)}`}>{analysis.emotion} {getEmotionEmoji(analysis.emotion)}</span></p>
                    <p><strong className="text-gray-900">Keywords:</strong> {analysis.keywords.join(', ')}</p>
                    <p><strong className="text-gray-900">Summary:</strong> {analysis.summary}</p>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="mt-4 w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Entry'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Insights Card */}
          <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Your Insights
            </h2>

            {insights ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-3xl font-bold text-blue-600">{insights.totalEntries}</p>
                  <p className="text-gray-700 font-medium">Total Entries</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-lg font-semibold text-gray-900">
                    {insights.topEmotion ? (
                      <span className={`px-2 py-1 rounded-full text-sm ${getEmotionColor(insights.topEmotion)}`}>
                        {insights.topEmotion} {getEmotionEmoji(insights.topEmotion)}
                      </span>
                    ) : 'N/A'}
                  </p>
                  <p className="text-gray-700 font-medium">Top Emotion</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-lg font-semibold text-gray-900">
                    {insights.mostUsedAmbience ? `${getAmbienceEmoji(insights.mostUsedAmbience)} ${insights.mostUsedAmbience}` : 'N/A'}
                  </p>
                  <p className="text-gray-700 font-medium">Most Used Ambience</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-700 font-medium mb-2">Recent Keywords</p>
                  <p className="text-gray-900">{insights.recentKeywords.join(', ') || 'None yet'}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Previous Entries */}
        <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Previous Entries
          </h2>

          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-gray-700">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No entries yet. Write your first journal entry!</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition duration-200 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getAmbienceEmoji(entry.ambience)}</span>
                      <span className="font-semibold text-gray-900 capitalize">{entry.ambience}</span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-gray-900 mb-3 leading-relaxed">{entry.text}</p>

                  {entry.emotion && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className={`px-2 py-1 rounded-full ${getEmotionColor(entry.emotion)}`}>
                        {entry.emotion} {getEmotionEmoji(entry.emotion)}
                      </span>
                      {entry.keywords && (
                        <span className="text-gray-700 font-medium">
                          Keywords: {entry.keywords}
                        </span>
                      )}
                    </div>
                  )}

                  {entry.summary && (
                    <p className="text-sm text-gray-700 mt-2 italic">{entry.summary}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
