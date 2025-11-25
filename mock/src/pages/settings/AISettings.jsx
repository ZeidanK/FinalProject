import { useState } from 'react';
import { Brain, Sliders, Zap, Save, Info } from 'lucide-react';

const AISettings = () => {
  const [settings, setSettings] = useState({
    aiProvider: 'openai',
    model: 'gpt-4',
    confidence: 85,
    autoMatch: true,
    autoLearn: true,
    contextRecognition: true,
    nameNormalization: true,
    anomalyDetection: true,
    customRules: true
  });

  const [apiKey, setApiKey] = useState('sk-...xxxx');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleSave = () => {
    alert('AI settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure AI-powered features and fine-tune recognition parameters
        </p>
      </div>

      {/* AI Provider Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Brain className="text-purple-600" size={24} />
          <span>AI Provider Configuration</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select
              value={settings.aiProvider}
              onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (PaLM)</option>
              <option value="azure">Azure OpenAI</option>
              <option value="custom">Custom Endpoint</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Selection
            </label>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gpt-4">GPT-4 (Most Accurate)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
              <option value="gpt-4-vision">GPT-4 Vision (For Scanned Docs)</option>
            </select>
          </div>

          {settings.aiProvider === 'openai' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
                <span className="text-xs text-gray-500 ml-2">(Optional - for enhanced features)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide your own API key for unlimited processing. Leave empty to use our shared pool.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recognition Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Sliders className="text-blue-600" size={24} />
          <span>Recognition & Matching Settings</span>
        </h2>

        <div className="space-y-6">
          {/* Confidence Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Minimum Confidence Threshold
              </label>
              <span className="text-sm font-semibold text-blue-600">{settings.confidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={settings.confidence}
              onChange={(e) => setSettings({ ...settings, confidence: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Lower (More Results)</span>
              <span>Higher (More Accuracy)</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Invoices with confidence below this threshold will require manual review
            </p>
          </div>

          {/* Toggle Features */}
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={settings.autoMatch}
                  onChange={(e) => setSettings({ ...settings, autoMatch: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">Automatic Matching</p>
                  <p className="text-sm text-gray-600">Automatically match invoices with high confidence scores</p>
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={settings.autoLearn}
                  onChange={(e) => setSettings({ ...settings, autoLearn: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">Continuous Learning</p>
                  <p className="text-sm text-gray-600">AI learns from your corrections to improve over time</p>
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={settings.contextRecognition}
                  onChange={(e) => setSettings({ ...settings, contextRecognition: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">Context Recognition</p>
                  <p className="text-sm text-gray-600">Use surrounding text to improve data extraction accuracy</p>
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={settings.nameNormalization}
                  onChange={(e) => setSettings({ ...settings, nameNormalization: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">Name Normalization</p>
                  <p className="text-sm text-gray-600">Match similar vendor names (e.g., "Acme Corp" = "ACME CORPORATION")</p>
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={settings.anomalyDetection}
                  onChange={(e) => setSettings({ ...settings, anomalyDetection: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">Real-time Anomaly Detection</p>
                  <p className="text-sm text-gray-600">Automatically flag unusual patterns and discrepancies</p>
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={settings.customRules}
                  onChange={(e) => setSettings({ ...settings, customRules: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">Custom Matching Rules</p>
                  <p className="text-sm text-gray-600">Apply business-specific rules for matching logic</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Customization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Zap className="text-yellow-600" size={24} />
          <span>Advanced Customization</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom AI Prompt (Optional)
              <span className="text-xs text-gray-500 ml-2">For fine-tuned extraction</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter custom instructions for AI processing..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Add specific instructions to help AI better understand your document formats
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Expert Feature</p>
                <p>Custom prompts allow you to tailor AI behavior for specific use cases. Incorrect prompts may reduce accuracy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current AI Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Avg Confidence</p>
            <p className="text-2xl font-bold text-green-600 mt-1">94.5%</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Auto-Matched</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">87%</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Processing Speed</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">2.3s</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Accuracy Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">98.2%</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Save size={18} />
          <span>Save Settings</span>
        </button>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">About AI Features</h3>
        <p className="text-blue-800 mb-4">
          Our AI-powered system uses advanced machine learning and natural language processing to automatically:
        </p>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Extract data from invoices and receipts with high accuracy</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Match invoices to bank transactions based on multiple criteria</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Detect anomalies and potential errors in real-time</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Learn from your corrections to continuously improve accuracy</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AISettings;
