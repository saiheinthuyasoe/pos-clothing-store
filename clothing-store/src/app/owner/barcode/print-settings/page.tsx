"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopNavBar } from "@/components/ui/TopNavBar";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { 
  Settings, 
  Printer, 
  Save, 
  RefreshCw,
  TestTube,
  AlertCircle,
  CheckCircle,
  Monitor,
  Smartphone,
  Tablet,
  Layout,
  Type,
  Palette
} from "lucide-react";

interface PrintSettings {
  // Printer Configuration
  defaultPrinter: string;
  printerType: 'thermal' | 'inkjet' | 'laser';
  connectionType: 'usb' | 'network' | 'bluetooth';
  printerIP: string;
  
  // Label Settings
  labelSize: 'small' | 'medium' | 'large' | 'custom';
  customWidth: number;
  customHeight: number;
  labelOrientation: 'portrait' | 'landscape';
  
  // Content Settings
  includeBarcode: boolean;
  includePrice: boolean;
  includeProductName: boolean;
  includeCategory: boolean;
  includeColors: boolean;
  includeSizes: boolean;
  includeSupplier: boolean;
  
  // Font Settings
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'arial' | 'helvetica' | 'courier' | 'times';
  fontWeight: 'normal' | 'bold';
  
  // Layout Settings
  margin: number;
  padding: number;
  spacing: number;
  alignment: 'left' | 'center' | 'right';
  
  // Receipt Settings
  receiptWidth: number;
  receiptHeader: string;
  receiptFooter: string;
  includeBusinessLogo: boolean;
  autoPrint: boolean;
  
  // Advanced Settings
  printQuality: 'draft' | 'normal' | 'high';
  printSpeed: 'slow' | 'normal' | 'fast';
  enableTestMode: boolean;
}

function PrintSettingsContent() {
  const [activeMenuItem, setActiveMenuItem] = useState("print-settings");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<PrintSettings>({
    // Printer Configuration
    defaultPrinter: '',
    printerType: 'thermal',
    connectionType: 'usb',
    printerIP: '',
    
    // Label Settings
    labelSize: 'medium',
    customWidth: 40,
    customHeight: 24,
    labelOrientation: 'portrait',
    
    // Content Settings
    includeBarcode: true,
    includePrice: true,
    includeProductName: true,
    includeCategory: true,
    includeColors: false,
    includeSizes: false,
    includeSupplier: false,
    
    // Font Settings
    fontSize: 'medium',
    fontFamily: 'arial',
    fontWeight: 'normal',
    
    // Layout Settings
    margin: 2,
    padding: 4,
    spacing: 2,
    alignment: 'center',
    
    // Receipt Settings
    receiptWidth: 80,
    receiptHeader: 'Thank you for shopping with us!',
    receiptFooter: 'Please keep this receipt for your records.',
    includeBusinessLogo: true,
    autoPrint: false,
    
    // Advanced Settings
    printQuality: 'normal',
    printSpeed: 'normal',
    enableTestMode: false,
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('printer');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would load from a service
      // For now, we'll use localStorage
      const savedSettings = localStorage.getItem('printSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.error('Error loading print settings:', err);
      setError('Failed to load print settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // In a real app, this would save to a service
      localStorage.setItem('printSettings', JSON.stringify(settings));
      
      setSuccess('Print settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving print settings:', err);
      setError('Failed to save print settings');
    } finally {
      setIsSaving(false);
    }
  };

  const testPrint = async () => {
    try {
      setIsTesting(true);
      setError(null);
      
      // Generate test label content
      const testContent = generateTestLabel();
      
      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(testContent);
        printWindow.document.close();
        printWindow.print();
      }
      
      setSuccess('Test print sent successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error testing print:', err);
      setError('Failed to send test print');
    } finally {
      setIsTesting(false);
    }
  };

  const generateTestLabel = () => {
    const labelSizeClass = {
      small: 'width: 8rem; height: 5rem;',
      medium: 'width: 10rem; height: 6rem;',
      large: 'width: 12rem; height: 8rem;',
      custom: `width: ${settings.customWidth}mm; height: ${settings.customHeight}mm;`
    }[settings.labelSize];

    const fontSizeClass = {
      small: '10px',
      medium: '12px',
      large: '14px'
    }[settings.fontSize];

    return `
      <html>
        <head>
          <title>Test Label</title>
          <style>
            body { margin: 0; padding: 20px; font-family: ${settings.fontFamily}, sans-serif; }
            .label { 
              ${labelSizeClass}
              border: 1px solid #000; 
              padding: ${settings.padding}px; 
              margin: ${settings.margin}px;
              display: flex; 
              flex-direction: column; 
              justify-content: space-between;
              text-align: ${settings.alignment};
              font-size: ${fontSizeClass};
              font-weight: ${settings.fontWeight};
            }
            .product-name { font-weight: bold; margin-bottom: ${settings.spacing}px; }
            .product-details { margin-bottom: ${settings.spacing}px; }
            .barcode { font-family: 'Courier New', monospace; text-align: center; }
            .price { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label">
            ${settings.includeProductName ? '<div class="product-name">TEST PRODUCT</div>' : ''}
            <div class="product-details">
              ${settings.includeCategory ? 'Category: Test Category<br>' : ''}
              ${settings.includeColors ? 'Colors: Red, Blue<br>' : ''}
              ${settings.includeSizes ? 'Sizes: M, L<br>' : ''}
              ${settings.includeSupplier ? 'Supplier: Test Supplier<br>' : ''}
            </div>
            ${settings.includeBarcode ? '<div class="barcode">1234567890123</div>' : ''}
            ${settings.includePrice ? '<div class="price">$29.99</div>' : ''}
          </div>
        </body>
      </html>
    `;
  };

  const handleSettingChange = (
    key: keyof PrintSettings,
    value: string | number | boolean
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'printer', label: 'Printer', icon: Printer },
    { id: 'labels', label: 'Labels', icon: Layout },
    { id: 'content', label: 'Content', icon: Type },
    { id: 'receipts', label: 'Receipts', icon: Monitor },
    { id: 'advanced', label: 'Advanced', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          activeItem={activeMenuItem}
          onItemClick={(item) => setActiveMenuItem(item.id)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isCartModalOpen={isCartModalOpen}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavBar onCartModalStateChange={setIsCartModalOpen} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading print settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeItem={activeMenuItem}
        onItemClick={(item) => setActiveMenuItem(item.id)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isCartModalOpen={isCartModalOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavBar onCartModalStateChange={setIsCartModalOpen} />
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Print Settings</h1>
                <p className="text-sm text-gray-500">Configure printer and label settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={testPrint}
                disabled={isTesting}
                variant="outline"
              >
                {isTesting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Print
              </Button>
              <Button
                onClick={saveSettings}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Tabs */}
            <div className="w-64 bg-white border-r border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-green-800">{success}</span>
                </div>
              )}
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-red-800">{error}</span>
                </div>
              )}

              {/* Printer Settings */}
              {activeTab === 'printer' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Printer Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Printer
                        </label>
                        <input
                          type="text"
                          value={settings.defaultPrinter}
                          onChange={(e) => handleSettingChange('defaultPrinter', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter printer name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Printer Type
                        </label>
                        <select
                          title="printerType"
                          value={settings.printerType}
                          onChange={(e) => handleSettingChange('printerType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        >
                          <option value="thermal">Thermal Printer</option>
                          <option value="inkjet">Inkjet Printer</option>
                          <option value="laser">Laser Printer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Connection Type
                        </label>
                        <select
                          title="connectionType"
                          value={settings.connectionType}
                          onChange={(e) => handleSettingChange('connectionType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        >
                          <option value="usb">USB</option>
                          <option value="network">Network</option>
                          <option value="bluetooth">Bluetooth</option>
                        </select>
                      </div>

                      {settings.connectionType === 'network' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Printer IP Address
                          </label>
                          <input
                            type="text"
                            value={settings.printerIP}
                            onChange={(e) => handleSettingChange('printerIP', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                            placeholder="192.168.1.100"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Label Settings */}
              {activeTab === 'labels' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Label Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Label Size
                        </label>
                        <select
                          title="labelSize"
                          value={settings.labelSize}
                          onChange={(e) => handleSettingChange('labelSize', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        >
                          <option value="small">Small (32x20mm)</option>
                          <option value="medium">Medium (40x24mm)</option>
                          <option value="large">Large (48x32mm)</option>
                          <option value="custom">Custom Size</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Orientation
                        </label>
                        <select
                          title="labelOrientation"
                          value={settings.labelOrientation}
                          onChange={(e) => handleSettingChange('labelOrientation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>

                      {settings.labelSize === 'custom' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Width (mm)
                            </label>
                            <input
                              title="number"
                              type="number"
                              min="10"
                              max="100"
                              value={settings.customWidth}
                              onChange={(e) => handleSettingChange('customWidth', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Height (mm)
                            </label>
                            <input
                              title="number"
                              type="number"
                              min="10"
                              max="100"
                              value={settings.customHeight}
                              onChange={(e) => handleSettingChange('customHeight', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Layout Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Margin (px)
                        </label>
                        <input
                         title="number"
                          type="number"
                          min="0"
                          max="10"
                          value={settings.margin}
                          onChange={(e) => handleSettingChange('margin', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Padding (px)
                        </label>
                        <input
                          title="number"
                          type="number"
                          min="0"
                          max="20"
                          value={settings.padding}
                          onChange={(e) => handleSettingChange('padding', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Text Alignment
                        </label>
                        <select
                          title="alignment"
                          value={settings.alignment}
                          onChange={(e) => handleSettingChange('alignment', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Settings */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Label Content</h2>
                    <div className="space-y-4">
                      {[
                        { key: 'includeProductName', label: 'Product Name' },
                        { key: 'includeBarcode', label: 'Barcode' },
                        { key: 'includePrice', label: 'Price' },
                        { key: 'includeCategory', label: 'Category' },
                        { key: 'includeColors', label: 'Available Colors' },
                        { key: 'includeSizes', label: 'Available Sizes' },
                        { key: 'includeSupplier', label: 'Supplier' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings[item.key as keyof PrintSettings] as boolean}
                            onChange={(e) => handleSettingChange(item.key as keyof PrintSettings, e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Font Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Size
                        </label>
                        <select
                         title="fontSize"
                          value={settings.fontSize}
                          onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Family
                        </label>
                        <select
                          title="fontFamily"
                          value={settings.fontFamily}
                          onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        >
                          <option value="arial">Arial</option>
                          <option value="helvetica">Helvetica</option>
                          <option value="courier">Courier</option>
                          <option value="times">Times New Roman</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Weight
                        </label>
                        <select
                          title="fontWeight"
                          value={settings.fontWeight}
                          onChange={(e) => handleSettingChange('fontWeight', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Settings */}
              {activeTab === 'receipts' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Receipt Configuration</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Receipt Width (mm)
                        </label>
                        <input
                          title="receiptWidth"
                          type="number"
                          min="50"
                          max="120"
                          value={settings.receiptWidth}
                          onChange={(e) => handleSettingChange('receiptWidth', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Receipt Header
                        </label>
                        <textarea
                          value={settings.receiptHeader}
                          onChange={(e) => handleSettingChange('receiptHeader', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                          placeholder="Enter receipt header text"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Receipt Footer
                        </label>
                        <textarea
                          value={settings.receiptFooter}
                          onChange={(e) => handleSettingChange('receiptFooter', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                          placeholder="Enter receipt footer text"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.includeBusinessLogo}
                            onChange={(e) => handleSettingChange('includeBusinessLogo', e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm text-gray-700">Include Business Logo</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.autoPrint}
                            onChange={(e) => handleSettingChange('autoPrint', e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm text-gray-700">Auto-print after checkout</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Settings */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Print Quality
                        </label>
                        <select
                          title="printQuality"
                          value={settings.printQuality}
                          onChange={(e) => handleSettingChange('printQuality', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="draft">Draft</option>
                          <option value="normal">Normal</option>
                          <option value="high">High Quality</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Print Speed
                        </label>
                        <select
                          title="printspeed"
                          value={settings.printSpeed}
                          onChange={(e) => handleSettingChange('printSpeed', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="slow">Slow</option>
                          <option value="normal">Normal</option>
                          <option value="fast">Fast</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.enableTestMode}
                          onChange={(e) => handleSettingChange('enableTestMode', e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">Enable Test Mode (prints to screen instead of printer)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrintSettingsPage() {
  return (
    <ProtectedRoute requiredRole="owner">
      <PrintSettingsContent />
    </ProtectedRoute>
  );
}