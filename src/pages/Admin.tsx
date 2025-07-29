import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  RefreshCw, 
  Database, 
  Music, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Terminal,
  AlertTriangle
} from 'lucide-react';

interface SyncJob {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
  lastRun?: string;
  status?: 'success' | 'error' | 'running' | 'never';
}

const Admin = () => {
  const { toast } = useToast();
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const [jobResults, setJobResults] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const syncJobs: SyncJob[] = [
    {
      id: 'popular-tours',
      name: 'Popular Tours Sync',
      description: 'Fetch and cache trending concerts from Ticketmaster',
      endpoint: 'sync-popular-tours',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      id: 'artist-songs',
      name: 'Artist Songs Sync',
      description: 'Update artist song libraries with Spotify data',
      endpoint: 'sync-artist-songs',
      icon: <Music className="h-5 w-5" />,
    },
    {
      id: 'test-ticketmaster',
      name: 'Test Ticketmaster API',
      description: 'Verify Ticketmaster API connectivity and response',
      endpoint: 'ticketmaster',
      icon: <Database className="h-5 w-5" />,
    },
    {
      id: 'test-spotify',
      name: 'Test Spotify API',
      description: 'Verify Spotify API connectivity and search functionality',
      endpoint: 'spotify',
      icon: <Users className="h-5 w-5" />,
    }
  ];

  const executeJob = async (job: SyncJob) => {
    setRunningJobs(prev => new Set(prev).add(job.id));
    addLog(`Starting ${job.name}...`);

    try {
      let response;
      
      if (job.endpoint === 'ticketmaster') {
        response = await supabase.functions.invoke('ticketmaster', {
          body: { 
            endpoint: 'featured', 
            params: { size: '50', countryCode: 'US' } 
          }
        });
      } else if (job.endpoint === 'spotify') {
        response = await supabase.functions.invoke('spotify', {
          body: { 
            action: 'searchArtist', 
            params: { artistName: 'Taylor Swift' } 
          }
        });
      } else {
        response = await supabase.functions.invoke(job.endpoint, {
          body: {}
        });
      }

      if (response.error) {
        throw response.error;
      }

      setJobResults(prev => ({
        ...prev,
        [job.id]: { 
          status: 'success', 
          data: response.data,
          timestamp: new Date().toISOString()
        }
      }));

      addLog(`✅ ${job.name} completed successfully`);
      
      toast({
        title: 'Success',
        description: `${job.name} completed successfully`,
      });

    } catch (error: any) {
      console.error(`Error executing ${job.name}:`, error);
      
      setJobResults(prev => ({
        ...prev,
        [job.id]: { 
          status: 'error', 
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }));

      addLog(`❌ ${job.name} failed: ${error.message || 'Unknown error'}`);
      
      toast({
        title: 'Error',
        description: `${job.name} failed: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setRunningJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.id);
        return newSet;
      });
    }
  };

  const executeAllJobs = async () => {
    addLog('🚀 Starting all sync jobs...');
    for (const job of syncJobs) {
      await executeJob(job);
      // Add small delay between jobs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    addLog('🎉 All sync jobs completed');
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  const getStatusIcon = (jobId: string) => {
    if (runningJobs.has(jobId)) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    const result = jobResults[jobId];
    if (!result) {
      return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
    
    return result.status === 'success' 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (jobId: string) => {
    if (runningJobs.has(jobId)) {
      return <Badge variant="secondary">Running</Badge>;
    }
    
    const result = jobResults[jobId];
    if (!result) {
      return <Badge variant="outline">Never Run</Badge>;
    }
    
    return result.status === 'success' 
      ? <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>
      : <Badge variant="destructive">Error</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage sync jobs and monitor system health
              </p>
            </div>
            <Button 
              onClick={executeAllJobs}
              disabled={runningJobs.size > 0}
              size="lg"
              className="gap-2"
            >
              {runningJobs.size > 0 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Run All Sync Jobs
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Sync Jobs */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sync Jobs</CardTitle>
                  <CardDescription>
                    Manually trigger background synchronization tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {syncJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {job.icon}
                        <div>
                          <h3 className="font-medium">{job.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {job.description}
                          </p>
                          {jobResults[job.id] && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last run: {new Date(jobResults[job.id].timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.id)}
                        {getStatusBadge(job.id)}
                        <Button
                          onClick={() => executeJob(job)}
                          disabled={runningJobs.has(job.id)}
                          variant="outline"
                          size="sm"
                        >
                          {runningJobs.has(job.id) ? 'Running...' : 'Run'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    System Logs
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <CardDescription>
                      Real-time sync job execution logs
                    </CardDescription>
                    <Button 
                      onClick={clearLogs} 
                      variant="ghost" 
                      size="sm"
                    >
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] w-full">
                    <div className="space-y-1">
                      {logs.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No logs yet...</p>
                      ) : (
                        logs.map((log, index) => (
                          <div 
                            key={index}
                            className="text-xs font-mono p-2 bg-muted rounded border-l-2 border-l-blue-500"
                          >
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => window.open('https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/functions', '_blank')}
                  >
                    <Database className="h-4 w-4" />
                    View Edge Functions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => window.open('https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/logs/functions', '_blank')}
                  >
                    <Terminal className="h-4 w-4" />
                    View Function Logs
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => window.open('https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/sql/new', '_blank')}
                  >
                    <Database className="h-4 w-4" />
                    SQL Editor
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Job Results */}
          {Object.keys(jobResults).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
                <CardDescription>
                  Output from recently executed sync jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(jobResults).map(([jobId, result]) => {
                    const job = syncJobs.find(j => j.id === jobId);
                    return (
                      <div key={jobId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{job?.name}</h3>
                          <div className="flex items-center gap-2">
                            {result.status === 'success' 
                              ? <CheckCircle className="h-4 w-4 text-green-500" />
                              : <XCircle className="h-4 w-4 text-red-500" />
                            }
                            <span className="text-sm text-muted-foreground">
                              {new Date(result.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <ScrollArea className="h-[100px] w-full">
                          <pre className="text-xs bg-muted p-3 rounded">
                            {result.error || JSON.stringify(result.data, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;