import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Mail, Settings, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

interface FormEmailRecipient {
  id?: string;
  email: string;
  name?: string;
  isActive: boolean;
  isPrimary: boolean;
}

interface FormConfiguration {
  id: string;
  formName: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  emailConfig: {
    subject: string;
    fromName: string;
    template: string;
  };
  recipients: FormEmailRecipient[];
}

const FormManagement = () => {
  const { toast } = useToast();
  const [formConfigs, setFormConfigs] = useState<FormConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FormConfiguration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState<Omit<FormConfiguration, 'id'>>({
    formName: '',
    displayName: '',
    description: '',
    isActive: true,
    emailConfig: {
      subject: '',
      fromName: '',
      template: ''
    },
    recipients: []
  });
  const [newRecipient, setNewRecipient] = useState<FormEmailRecipient>({
    email: '',
    name: '',
    isActive: true,
    isPrimary: false
  });

  // Fetch form configurations
  const fetchFormConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/form-configurations');
      if (response.ok) {
        const data = await response.json();
        setFormConfigs(data);
      } else {
        throw new Error('Failed to fetch form configurations');
      }
    } catch (error) {
      console.error('Error fetching form configurations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch form configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormConfigs();
  }, []);

  // Save form configuration
  const saveFormConfig = async (config: FormConfiguration) => {
    try {
      const response = await fetch(`/api/form-configurations/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Form configuration updated successfully"
        });
        fetchFormConfigs();
        setIsEditDialogOpen(false);
        setEditingConfig(null);
      } else {
        throw new Error('Failed to update form configuration');
      }
    } catch (error) {
      console.error('Error updating form configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update form configuration",
        variant: "destructive"
      });
    }
  };

  // Delete form configuration
  const deleteFormConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/form-configurations/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Form configuration deleted successfully"
        });
        fetchFormConfigs();
      } else {
        throw new Error('Failed to delete form configuration');
      }
    } catch (error) {
      console.error('Error deleting form configuration:', error);
      toast({
        title: "Error",
        description: "Failed to delete form configuration",
        variant: "destructive"
      });
    }
  };

  // Add recipient to editing config
  const addRecipient = () => {
    if (!newRecipient.email) {
      toast({
        title: "Error",
        description: "Email address is required",
        variant: "destructive"
      });
      return;
    }

    if (editingConfig) {
      const updatedConfig = {
        ...editingConfig,
        recipients: [...editingConfig.recipients, { ...newRecipient, id: Date.now().toString() }]
      };
      setEditingConfig(updatedConfig);
      setNewRecipient({ email: '', name: '', isActive: true, isPrimary: false });
    }
  };

  // Remove recipient from editing config
  const removeRecipient = (recipientId: string) => {
    if (editingConfig) {
      const updatedConfig = {
        ...editingConfig,
        recipients: editingConfig.recipients.filter(r => r.id !== recipientId)
      };
      setEditingConfig(updatedConfig);
    }
  };

  // Toggle recipient primary status
  const togglePrimary = (recipientId: string) => {
    if (editingConfig) {
      const updatedConfig = {
        ...editingConfig,
        recipients: editingConfig.recipients.map(r => ({
          ...r,
          isPrimary: r.id === recipientId ? !r.isPrimary : false
        }))
      };
      setEditingConfig(updatedConfig);
    }
  };

  // Open edit dialog
  const openEditDialog = (config: FormConfiguration) => {
    setEditingConfig({ ...config });
    setIsEditDialogOpen(true);
  };

  // Create new form configuration
  const createFormConfig = async (config: Omit<FormConfiguration, 'id'>) => {
    try {
      const response = await fetch('/api/form-configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Form configuration created successfully"
        });
        fetchFormConfigs();
        setIsCreateDialogOpen(false);
      } else {
        throw new Error('Failed to create form configuration');
      }
    } catch (error) {
      console.error('Error creating form configuration:', error);
      toast({
        title: "Error",
        description: "Failed to create form configuration",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Form Management</h2>
          <p className="text-muted-foreground">
            Manage email recipients and templates for all forms
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Form
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {formConfigs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.displayName}
                      <Badge variant={config.isActive ? "default" : "secondary"}>
                        {config.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {config.description || `Form: ${config.formName}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(config)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFormConfig(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Email Recipients</Label>
                    <div className="mt-2 space-y-2">
                      {config.recipients.map((recipient, index) => (
                        <div key={recipient.id || index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Mail className="h-4 w-4" />
                          <span className="flex-1">
                            {recipient.name ? `${recipient.name} (${recipient.email})` : recipient.email}
                          </span>
                          {recipient.isPrimary && (
                            <Badge variant="outline" className="text-xs">
                              Primary
                            </Badge>
                          )}
                          <Badge variant={recipient.isActive ? "default" : "secondary"} className="text-xs">
                            {recipient.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Email Subject</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.emailConfig.subject}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form Configuration</DialogTitle>
            <DialogDescription>
              Update email recipients and settings for {editingConfig?.displayName}
            </DialogDescription>
          </DialogHeader>
          
          {editingConfig && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={editingConfig.displayName}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      displayName: e.target.value
                    })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editingConfig.isActive}
                    onCheckedChange={(checked) => setEditingConfig({
                      ...editingConfig,
                      isActive: checked
                    })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingConfig.description || ''}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    description: e.target.value
                  })}
                  rows={2}
                />
              </div>

              {/* Email Config */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emailSubject">Email Subject</Label>
                  <Input
                    id="emailSubject"
                    value={editingConfig.emailConfig.subject}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      emailConfig: {
                        ...editingConfig.emailConfig,
                        subject: e.target.value
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={editingConfig.emailConfig.fromName}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      emailConfig: {
                        ...editingConfig.emailConfig,
                        fromName: e.target.value
                      }
                    })}
                  />
                </div>
              </div>

              {/* Recipients */}
              <div>
                <Label>Email Recipients</Label>
                <div className="mt-2 space-y-2">
                  {editingConfig.recipients.map((recipient, index) => (
                    <div key={recipient.id || index} className="flex items-center gap-2 p-3 border rounded">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Email address"
                          value={recipient.email}
                          onChange={(e) => {
                            const updatedRecipients = [...editingConfig.recipients];
                            updatedRecipients[index] = { ...recipient, email: e.target.value };
                            setEditingConfig({
                              ...editingConfig,
                              recipients: updatedRecipients
                            });
                          }}
                        />
                        <Input
                          placeholder="Display name (optional)"
                          value={recipient.name || ''}
                          onChange={(e) => {
                            const updatedRecipients = [...editingConfig.recipients];
                            updatedRecipients[index] = { ...recipient, name: e.target.value };
                            setEditingConfig({
                              ...editingConfig,
                              recipients: updatedRecipients
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePrimary(recipient.id || index.toString())}
                        >
                          {recipient.isPrimary ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRecipient(recipient.id || index.toString())}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Recipient */}
                <div className="mt-4 p-3 border-2 border-dashed rounded">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Email address"
                      value={newRecipient.email}
                      onChange={(e) => setNewRecipient({
                        ...newRecipient,
                        email: e.target.value
                      })}
                    />
                    <Input
                      placeholder="Display name (optional)"
                      value={newRecipient.name}
                      onChange={(e) => setNewRecipient({
                        ...newRecipient,
                        name: e.target.value
                      })}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button onClick={addRecipient} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Recipient
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="newRecipientPrimary"
                        checked={newRecipient.isPrimary}
                        onCheckedChange={(checked) => setNewRecipient({
                          ...newRecipient,
                          isPrimary: checked
                        })}
                      />
                      <Label htmlFor="newRecipientPrimary" className="text-sm">Primary</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingConfig(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => saveFormConfig(editingConfig)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Form Configuration</DialogTitle>
            <DialogDescription>
              Add a new form configuration with email recipients and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newFormName">Form Name</Label>
                <Input
                  id="newFormName"
                  placeholder="e.g., contact-form"
                  value={newForm.formName}
                  onChange={(e) => setNewForm({
                    ...newForm,
                    formName: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="newDisplayName">Display Name</Label>
                <Input
                  id="newDisplayName"
                  placeholder="e.g., Contact Form"
                  value={newForm.displayName}
                  onChange={(e) => setNewForm({
                    ...newForm,
                    displayName: e.target.value
                  })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="newDescription">Description</Label>
              <Textarea
                id="newDescription"
                placeholder="Description of the form"
                value={newForm.description}
                onChange={(e) => setNewForm({
                  ...newForm,
                  description: e.target.value
                })}
                rows={2}
              />
            </div>

            {/* Email Config */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newEmailSubject">Email Subject</Label>
                <Input
                  id="newEmailSubject"
                  placeholder="e.g., New Contact Form - Unit {unitNumber}"
                  value={newForm.emailConfig.subject}
                  onChange={(e) => setNewForm({
                    ...newForm,
                    emailConfig: {
                      ...newForm.emailConfig,
                      subject: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="newFromName">From Name</Label>
                <Input
                  id="newFromName"
                  placeholder="e.g., Spectrum 4 Contact Form"
                  value={newForm.emailConfig.fromName}
                  onChange={(e) => setNewForm({
                    ...newForm,
                    emailConfig: {
                      ...newForm.emailConfig,
                      fromName: e.target.value
                    }
                  })}
                />
              </div>
            </div>

            {/* Recipients */}
            <div>
              <Label>Email Recipients</Label>
              <div className="mt-2 space-y-2">
                {newForm.recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Email address"
                        value={recipient.email}
                        onChange={(e) => {
                          const updatedRecipients = [...newForm.recipients];
                          updatedRecipients[index] = { ...recipient, email: e.target.value };
                          setNewForm({
                            ...newForm,
                            recipients: updatedRecipients
                          });
                        }}
                      />
                      <Input
                        placeholder="Display name (optional)"
                        value={recipient.name || ''}
                        onChange={(e) => {
                          const updatedRecipients = [...newForm.recipients];
                          updatedRecipients[index] = { ...recipient, name: e.target.value };
                          setNewForm({
                            ...newForm,
                            recipients: updatedRecipients
                          });
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updatedRecipients = newForm.recipients.filter((_, i) => i !== index);
                        setNewForm({
                          ...newForm,
                          recipients: updatedRecipients
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add New Recipient */}
              <div className="mt-4 p-3 border-2 border-dashed rounded">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Email address"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient({
                      ...newRecipient,
                      email: e.target.value
                    })}
                  />
                  <Input
                    placeholder="Display name (optional)"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient({
                      ...newRecipient,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    onClick={() => {
                      if (!newRecipient.email) {
                        toast({
                          title: "Error",
                          description: "Email address is required",
                          variant: "destructive"
                        });
                        return;
                      }
                      setNewForm({
                        ...newForm,
                        recipients: [...newForm.recipients, { ...newRecipient, id: Date.now().toString() }]
                      });
                      setNewRecipient({ email: '', name: '', isActive: true, isPrimary: false });
                    }} 
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="newRecipientPrimary"
                      checked={newRecipient.isPrimary}
                      onCheckedChange={(checked) => setNewRecipient({
                        ...newRecipient,
                        isPrimary: checked
                      })}
                    />
                    <Label htmlFor="newRecipientPrimary" className="text-sm">Primary</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewForm({
                    formName: '',
                    displayName: '',
                    description: '',
                    isActive: true,
                    emailConfig: {
                      subject: '',
                      fromName: '',
                      template: ''
                    },
                    recipients: []
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => createFormConfig(newForm)}
                disabled={!newForm.formName || !newForm.displayName || !newForm.emailConfig.subject}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormManagement;
