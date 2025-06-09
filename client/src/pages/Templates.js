import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    day: 0,
    variant: 1
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/templates');
      
      // Group templates by day
      const groupedTemplates = response.data.reduce((acc, template) => {
        if (!acc[template.day]) {
          acc[template.day] = [];
        }
        acc[template.day].push(template);
        return acc;
      }, {});
      
      setTemplates(groupedTemplates);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates. Please try again later.');
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/templates', newTemplate);
      
      // Reset form
      setNewTemplate({
        name: '',
        content: '',
        day: 0,
        variant: 1
      });
      
      // Refresh templates
      fetchTemplates();
    } catch (err) {
      console.error('Error creating template:', err);
      alert('Failed to create template. Please try again.');
    }
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/templates/${editingTemplate.id}`, editingTemplate);
      
      // Reset editing state
      setEditingTemplate(null);
      
      // Refresh templates
      fetchTemplates();
    } catch (err) {
      console.error('Error updating template:', err);
      alert('Failed to update template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/templates/${templateId}`);
      
      // Refresh templates
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template. Please try again.');
    }
  };

  const getDayLabel = (day) => {
    switch (parseInt(day)) {
      case 0: return 'Initial Message (Day 0)';
      case 1: return 'Day 1 Follow-up';
      case 3: return 'Day 3 Follow-up';
      case 5: return 'Day 5 Follow-up';
      case 7: return 'Day 7 Follow-up';
      case 10: return 'Day 10 Follow-up';
      case 14: return 'Day 14 Follow-up';
      case 21: return 'Day 21 Follow-up';
      case 28: return 'Day 28 Follow-up';
      default: return `Day ${day} Follow-up`;
    }
  };

  if (loading && Object.keys(templates).length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          className="mt-2 btn btn-danger"
          onClick={fetchTemplates}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Message Templates</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingTemplate(null);
            document.getElementById('createTemplateModal').showModal();
          }}
        >
          Add New Template
        </button>
      </div>

      <div className="card mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Templates are used for automated follow-up messages. Each day can have multiple template variants, 
          and one will be randomly selected when sending follow-ups. All templates must comply with TCPA regulations.
        </p>
      </div>

      {/* Templates by Day */}
      {Object.keys(templates).length > 0 ? (
        Object.keys(templates)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((day) => (
            <div key={day} className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">{getDayLabel(day)}</h2>
              
              <div className="space-y-4">
                {templates[day].map((template) => (
                  <div 
                    key={template.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Variant {template.variant}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-xs btn-secondary"
                          onClick={() => {
                            setEditingTemplate(template);
                            document.getElementById('editTemplateModal').showModal();
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-xs btn-danger"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <p className="whitespace-pre-wrap">{template.content}</p>
                    </div>
                    
                    <div className="mt-2 text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {template.content.length}/160 characters
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            No templates found. Create your first template to get started.
          </p>
        </div>
      )}

      {/* Create Template Modal */}
      <dialog id="createTemplateModal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Create New Template</h3>
          
          <form onSubmit={handleCreateTemplate}>
            <div className="space-y-4">
              <div>
                <label className="form-label">Template Name</label>
                <input
                  type="text"
                  className="input w-full"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Day</label>
                  <select
                    className="select w-full"
                    value={newTemplate.day}
                    onChange={(e) => setNewTemplate({...newTemplate, day: parseInt(e.target.value)})}
                    required
                  >
                    <option value="0">Initial (Day 0)</option>
                    <option value="1">Day 1</option>
                    <option value="3">Day 3</option>
                    <option value="5">Day 5</option>
                    <option value="7">Day 7</option>
                    <option value="10">Day 10</option>
                    <option value="14">Day 14</option>
                    <option value="21">Day 21</option>
                    <option value="28">Day 28</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Variant</label>
                  <input
                    type="number"
                    className="input w-full"
                    min="1"
                    value={newTemplate.variant}
                    onChange={(e) => setNewTemplate({...newTemplate, variant: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label">Message Content</label>
                <textarea
                  className="textarea w-full h-32"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  maxLength="160"
                  required
                ></textarea>
                <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
                  {newTemplate.content.length}/160 characters
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => document.getElementById('createTemplateModal').close()}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Template
                </button>
              </div>
            </div>
          </form>
        </div>
      </dialog>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <dialog id="editTemplateModal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit Template</h3>
            
            <form onSubmit={handleUpdateTemplate}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Template Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Day</label>
                    <select
                      className="select w-full"
                      value={editingTemplate.day}
                      onChange={(e) => setEditingTemplate({...editingTemplate, day: parseInt(e.target.value)})}
                      required
                    >
                      <option value="0">Initial (Day 0)</option>
                      <option value="1">Day 1</option>
                      <option value="3">Day 3</option>
                      <option value="5">Day 5</option>
                      <option value="7">Day 7</option>
                      <option value="10">Day 10</option>
                      <option value="14">Day 14</option>
                      <option value="21">Day 21</option>
                      <option value="28">Day 28</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Variant</label>
                    <input
                      type="number"
                      className="input w-full"
                      min="1"
                      value={editingTemplate.variant}
                      onChange={(e) => setEditingTemplate({...editingTemplate, variant: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Message Content</label>
                  <textarea
                    className="textarea w-full h-32"
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                    maxLength="160"
                    required
                  ></textarea>
                  <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
                    {editingTemplate.content.length}/160 characters
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => document.getElementById('editTemplateModal').close()}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Template
                  </button>
                </div>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default Templates;
