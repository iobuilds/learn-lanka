import { useState } from 'react';
import { 
  MessageSquare, 
  Edit, 
  Save, 
  X, 
  Loader2,
  ToggleLeft,
  ToggleRight,
  Info,
  Variable
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SmsTemplate {
  id: string;
  template_key: string;
  template_name: string;
  template_body: string;
  description: string | null;
  variables: string[];
  is_active: boolean;
  updated_at: string;
}

const SmsTemplatesManager = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [editedBody, setEditedBody] = useState('');

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['sms-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('template_name');
      if (error) throw error;
      return data as SmsTemplate[];
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, template_body }: { id: string; template_body: string }) => {
      const { error } = await supabase
        .from('sms_templates')
        .update({ 
          template_body,
          updated_by: user?.id 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template updated!');
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('sms_templates')
        .update({ is_active, updated_by: user?.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template status updated!');
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  const openEditDialog = (template: SmsTemplate) => {
    setEditingTemplate(template);
    setEditedBody(template.template_body);
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    updateMutation.mutate({ id: editingTemplate.id, template_body: editedBody });
  };

  const insertVariable = (variable: string) => {
    setEditedBody(prev => prev + `{${variable}}`);
  };

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Templates
          </CardTitle>
          <CardDescription>
            Customize SMS notification messages. Use {'{variable}'} syntax for dynamic content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.map((template) => (
            <div 
              key={template.id} 
              className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{template.template_name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {template.template_key}
                    </Badge>
                    {!template.is_active && (
                      <Badge variant="secondary" className="text-xs">Disabled</Badge>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                  )}
                  <p className="text-sm bg-muted p-2 rounded font-mono">
                    {template.template_body}
                  </p>
                  {template.variables.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Variables:</span>
                      {template.variables.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs font-mono">
                          {'{' + v + '}'}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={template.is_active ? 'text-green-600' : 'text-muted-foreground'}
                        onClick={() => toggleMutation.mutate({ id: template.id, is_active: !template.is_active })}
                      >
                        {template.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {template.is_active ? 'Disable template' : 'Enable template'}
                    </TooltipContent>
                  </Tooltip>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No SMS templates found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit SMS Template</DialogTitle>
            <DialogDescription>
              {editingTemplate?.template_name} - {editingTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={4}
                className="font-mono text-sm"
                placeholder="Enter your SMS template..."
              />
              <p className="text-xs text-muted-foreground">
                Character count: {editedBody.length} (SMS limit: ~160 chars per segment)
              </p>
            </div>

            {editingTemplate?.variables && editingTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Variable className="w-4 h-4" />
                  Available Variables
                </Label>
                <div className="flex flex-wrap gap-2">
                  {editingTemplate.variables.map((variable) => (
                    <Button
                      key={variable}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs"
                      onClick={() => insertVariable(variable)}
                    >
                      {'{' + variable + '}'}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Click a variable to insert it at the end
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <p className="text-sm mt-1">{editedBody || 'No content'}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending || !editedBody.trim()}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SmsTemplatesManager;
