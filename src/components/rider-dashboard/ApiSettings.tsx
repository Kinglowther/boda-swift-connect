
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const ApiSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const storedKey = localStorage.getItem('openrouteservice_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('openrouteservice_api_key', apiKey);
    toast({
      title: 'API Key Saved',
      description: 'Your OpenRouteService API key has been saved locally.',
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>API Settings</CardTitle>
        <CardDescription>
          Provide API keys for enhanced features like route-based distance calculation. 
          Keys are stored in your browser's local storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ors-api-key">OpenRouteService API Key</Label>
          <div className="flex space-x-2">
            <Input
              id="ors-api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button onClick={handleSave}>Save</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Get a free key from{' '}
            <a
              href="https://openrouteservice.org/dev/#/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500"
            >
              openrouteservice.org
            </a>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiSettings;
