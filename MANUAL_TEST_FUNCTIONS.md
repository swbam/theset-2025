# Manual Test and Data Import

Let me test the functions manually to get initial data imported:

## 1. Test Ticketmaster Function
First, let's test the ticketmaster function to make sure it's working:

```javascript
// Test the ticketmaster function
fetch('https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/ticketmaster', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E'
  },
  body: JSON.stringify({
    endpoint: 'featured',
    params: {
      size: '20',
      countryCode: 'US'
    }
  })
})
.then(r => r.json())
.then(data => console.log('Ticketmaster response:', data))
.catch(err => console.error('Error:', err));
```

## 2. Manually Import Popular Tours
Once Ticketmaster is working, run the sync:

```javascript
// Test sync-popular-tours
fetch('https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E'
  },
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('Sync response:', data))
.catch(err => console.error('Error:', err));
```

## 3. Test Artist Search
Test searching for specific artists:

```javascript
// Test artist search
fetch('https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/ticketmaster', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E'
  },
  body: JSON.stringify({
    endpoint: 'search',
    query: 'Taylor Swift'
  })
})
.then(r => r.json())
.then(data => console.log('Artist search response:', data))
.catch(err => console.error('Error:', err));
```

## Expected Results
After these tests work:
1. Database should have popular shows imported
2. Artists table should be populated
3. Search should return real results
4. Homepage should show data

Run these tests in the browser console and let me know the results!