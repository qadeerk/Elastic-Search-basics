import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save, Edit2, Trash2, Plus, Info } from 'lucide-react';
import { useApi } from '../context/ApiContext';
import { useUIState } from '../hooks/useUIState';

const DatasetSettingsModal = ({ isOpen, onClose, dataset }) => {
  const [datasetDetails, setDatasetDetails] = useState(null);
  const [tileMapping, setTileMapping] = useState({
    title: '',
    subtitle: '',
    image: '',
    description: '',
    metadata: [],
    genres: '',
    cast: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [saving, setSaving] = useState(false);

  const api = useApi();
  const { getTileMapping, setTileMapping: saveTileMappingToState } = useUIState();

  useEffect(() => {
    if (isOpen && dataset) {
      loadDatasetDetails();
      loadTileMapping();
    }
  }, [isOpen, dataset]);

  const loadDatasetDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getDatasetDetails(dataset);
      setDatasetDetails(response.details);
    } catch (err) {
      setError(`Failed to load dataset details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTileMapping = () => {
    const mapping = getTileMapping(dataset);
    if (mapping) {
      setTileMapping(mapping);
    } else {
      // Reset to empty mapping
      setTileMapping({
        title: '',
        subtitle: '',
        image: '',
        description: '',
        metadata: [],
        genres: '',
        cast: ''
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!tileMapping.title) {
        throw new Error('Title field is required');
      }

      // Save to localStorage via hook
      saveTileMappingToState(dataset, tileMapping);
      
      // Also save to server
      await api.saveTileMapping(dataset, tileMapping);
      
      onClose();
    } catch (err) {
      setError(`Failed to save mapping: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setTileMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMetadataField = () => {
    setTileMapping(prev => ({
      ...prev,
      metadata: [...prev.metadata, '']
    }));
  };

  const updateMetadataField = (index, value) => {
    setTileMapping(prev => ({
      ...prev,
      metadata: prev.metadata.map((field, i) => i === index ? value : field)
    }));
  };

  const removeMetadataField = (index) => {
    setTileMapping(prev => ({
      ...prev,
      metadata: prev.metadata.filter((_, i) => i !== index)
    }));
  };

  const getAvailableFields = () => {
    if (!datasetDetails || !datasetDetails.mapping) return [];
    
    const extractFields = (properties, prefix = '') => {
      const fields = [];
      Object.entries(properties).forEach(([key, value]) => {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        fields.push(fieldPath);
        
        if (value.properties) {
          fields.push(...extractFields(value.properties, fieldPath));
        }
      });
      return fields;
    };

    const mapping = datasetDetails.mapping.mappings || datasetDetails.mapping;
    return extractFields(mapping.properties || {});
  };

  const InlineEditField = ({ label, value, field, placeholder, suggestions = [] }) => {
    const isEditing = editingField === field;
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <div className="flex-1">
              <input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingField(null);
                  if (e.key === 'Escape') {
                    setEditingField(null);
                    // Reset value if needed
                  }
                }}
              />
              {suggestions.length > 0 && (
                <div className="mt-1 text-xs text-slate-500">
                  Suggestions: {suggestions.slice(0, 5).join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div 
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-100"
              onClick={() => setEditingField(field)}
            >
              {value || (
                <span className="text-slate-400">{placeholder}</span>
              )}
            </div>
          )}
          <button
            onClick={() => setEditingField(isEditing ? null : field)}
            className="p-2 text-slate-500 hover:text-slate-700"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Dataset Settings: {dataset}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="loading-spinner mr-3"></div>
                    <span>Loading dataset details...</span>
                  </div>
                ) : error ? (
                  <div className="error-alert mb-4">
                    <span>{error}</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Dataset Info */}
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="w-4 h-4 text-slate-500" />
                        <h4 className="font-medium text-slate-700">Dataset Information</h4>
                      </div>
                      {datasetDetails && (
                        <div className="text-sm text-slate-600">
                          <p>Document count: {datasetDetails.count?.toLocaleString() || 'Unknown'}</p>
                          <p>Fields: {getAvailableFields().length}</p>
                        </div>
                      )}
                    </div>

                    {/* Tile Mapping Configuration */}
                    <div>
                      <h4 className="font-medium text-slate-700 mb-4">Tile Display Configuration</h4>
                      <div className="space-y-4">
                        <InlineEditField
                          label="Title Field *"
                          value={tileMapping.title}
                          field="title"
                          placeholder="e.g., title, name"
                          suggestions={getAvailableFields().filter(f => 
                            f.toLowerCase().includes('title') || 
                            f.toLowerCase().includes('name')
                          )}
                        />

                        <InlineEditField
                          label="Subtitle Field"
                          value={tileMapping.subtitle}
                          field="subtitle"
                          placeholder="e.g., tagline, description"
                          suggestions={getAvailableFields().filter(f => 
                            f.toLowerCase().includes('tagline') || 
                            f.toLowerCase().includes('subtitle')
                          )}
                        />

                        <InlineEditField
                          label="Image Field"
                          value={tileMapping.image}
                          field="image"
                          placeholder="e.g., poster_path, image_url"
                          suggestions={getAvailableFields().filter(f => 
                            f.toLowerCase().includes('image') || 
                            f.toLowerCase().includes('poster') ||
                            f.toLowerCase().includes('photo')
                          )}
                        />

                        <InlineEditField
                          label="Description Field"
                          value={tileMapping.description}
                          field="description"
                          placeholder="e.g., overview, description"
                          suggestions={getAvailableFields().filter(f => 
                            f.toLowerCase().includes('description') || 
                            f.toLowerCase().includes('overview') ||
                            f.toLowerCase().includes('summary')
                          )}
                        />

                        <InlineEditField
                          label="Genres Field"
                          value={tileMapping.genres}
                          field="genres"
                          placeholder="e.g., genres.name, categories"
                          suggestions={getAvailableFields().filter(f => 
                            f.toLowerCase().includes('genre') || 
                            f.toLowerCase().includes('category')
                          )}
                        />

                        <InlineEditField
                          label="Cast Field"
                          value={tileMapping.cast}
                          field="cast"
                          placeholder="e.g., cast.name, actors"
                          suggestions={getAvailableFields().filter(f => 
                            f.toLowerCase().includes('cast') || 
                            f.toLowerCase().includes('actor')
                          )}
                        />

                        {/* Metadata Fields */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-700">
                              Metadata Fields
                            </label>
                            <button
                              onClick={addMetadataField}
                              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Field
                            </button>
                          </div>
                          <div className="space-y-2">
                            {tileMapping.metadata.map((field, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={field}
                                  onChange={(e) => updateMetadataField(index, e.target.value)}
                                  placeholder="e.g., release_date, vote_average"
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => removeMetadataField(index)}
                                  className="p-2 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={onClose}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || !tileMapping.title}
                        className="btn-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DatasetSettingsModal; 