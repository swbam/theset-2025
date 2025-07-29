import React from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Search() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Search Artists</h1>
          <p className="text-muted-foreground">
            Find your favorite artists and discover their upcoming shows
          </p>
        </div>

        <div className="mb-8">
          <SearchBar />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How to Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                • Type the name of any artist to search for their upcoming shows
              </p>
              <p>
                • Click on an artist from the search results to view their profile
              </p>
              <p>
                • Browse their upcoming shows and participate in setlist voting
              </p>
              <p>
                • Sign in to vote on songs and suggest new tracks for setlists
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}