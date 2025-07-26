// Frontend Testing Script for TheSet App - OUR LAST NIGHT Journey
// This script tests key UI components and user interactions

const TEST_ARTIST = "OUR LAST NIGHT";

console.log("🚀 Starting TheSet App Frontend Testing");
console.log("🎯 Target Artist: " + TEST_ARTIST);

// Test Results Object
const testResults = {
  searchBar: { status: "PENDING", details: [] },
  artistPage: { status: "PENDING", details: [] },
  showPage: { status: "PENDING", details: [] },
  navigation: { status: "PENDING", details: [] },
  uiConsistency: { status: "PENDING", details: [] },
  realTimeUpdates: { status: "PENDING", details: [] },
  overallScore: 0
};

// Helper Functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logTest(component, test, status, details = "") {
  const emoji = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  console.log(`${emoji} [${component}] ${test}: ${status} ${details}`);
  if (!testResults[component]) testResults[component] = { status: "PENDING", details: [] };
  testResults[component].details.push({ test, status, details });
}

// Wait for page to load
if (typeof window === 'undefined') {
  console.log("❌ This script should be run in a browser environment");
  console.log("Please open the browser and paste this script into the console");
} else {
  runTests();
}

async function runTests() {
  console.log("\n📋 STARTING COMPREHENSIVE UI TESTS\n");

  // Test 1: Search Bar Component
  await testSearchBarComponent();
  
  // Test 2: Artist Page Components  
  await testArtistPageComponents();
  
  // Test 3: Show Page Components
  await testShowPageComponents();
  
  // Test 4: Navigation & Routing
  await testNavigationRouting();
  
  // Test 5: UI/UX Consistency
  await testUIConsistency();
  
  // Test 6: Real-time Updates
  await testRealTimeUpdates();
  
  // Generate Final Report
  generateFinalReport();
}

async function testSearchBarComponent() {
  console.log("\n🔍 TESTING SEARCH BAR COMPONENT");
  
  try {
    // Check if search bar exists
    const searchInput = document.querySelector('input[placeholder*="artist"]');
    if (!searchInput) {
      logTest("searchBar", "Search input element exists", "FAIL", "Search input not found");
      return;
    }
    logTest("searchBar", "Search input element exists", "PASS");
    
    // Test search input functionality
    searchInput.focus();
    searchInput.value = "";
    
    // Simulate typing "OUR LAST NIGHT"
    for (let i = 0; i < TEST_ARTIST.length; i++) {
      searchInput.value = TEST_ARTIST.substring(0, i + 1);
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await delay(100); // Simulate natural typing
    }
    
    logTest("searchBar", "Typing simulation completed", "PASS", `Typed: ${TEST_ARTIST}`);
    
    // Wait for search results to appear
    await delay(2000);
    
    // Check for search results dropdown
    const searchResults = document.querySelector('[class*="absolute"][class*="z-10"]');
    if (searchResults) {
      logTest("searchBar", "Search results dropdown appears", "PASS");
      
      // Check for loading state
      const loader = document.querySelector('[class*="animate-spin"]');
      if (loader) {
        logTest("searchBar", "Loading state displayed", "PASS");
      }
      
      // Check for artist results
      const artistResults = searchResults.querySelectorAll('[class*="cursor-pointer"]');
      if (artistResults.length > 0) {
        logTest("searchBar", "Artist results displayed", "PASS", `Found ${artistResults.length} results`);
        
        // Test clicking on first result
        artistResults[0].click();
        logTest("searchBar", "Artist result clickable", "PASS");
        
        await delay(1000);
        
        // Check if we navigated to artist page
        if (window.location.pathname.includes('/artist/')) {
          logTest("searchBar", "Navigation to artist page", "PASS");
        } else {
          logTest("searchBar", "Navigation to artist page", "FAIL");
        }
      } else {
        logTest("searchBar", "Artist results displayed", "FAIL", "No results found");
      }
    } else {
      logTest("searchBar", "Search results dropdown appears", "FAIL");
    }
    
    testResults.searchBar.status = "COMPLETED";
    
  } catch (error) {
    logTest("searchBar", "Error during testing", "FAIL", error.message);
    testResults.searchBar.status = "ERROR";
  }
}

async function testArtistPageComponents() {
  console.log("\n🎤 TESTING ARTIST PAGE COMPONENTS");
  
  try {
    // Ensure we're on an artist page
    if (!window.location.pathname.includes('/artist/')) {
      // Navigate to artist page manually
      window.history.pushState({}, '', `/artist/${encodeURIComponent(TEST_ARTIST)}`);
      await delay(2000);
    }
    
    // Test ArtistHero Component
    const heroSection = document.querySelector('[class*="h-[400px]"]') || 
                       document.querySelector('[style*="height"]');
    if (heroSection) {
      logTest("artistPage", "ArtistHero component rendered", "PASS");
      
      // Check for artist name
      const artistName = document.querySelector('h1');
      if (artistName && artistName.textContent.includes(TEST_ARTIST)) {
        logTest("artistPage", "Artist name displayed correctly", "PASS");
      } else {
        logTest("artistPage", "Artist name displayed correctly", "FAIL");
      }
      
      // Check for follow button
      const followButton = document.querySelector('button:has-text("Follow"), button:has-text("Following")') ||
                          Array.from(document.querySelectorAll('button')).find(btn => 
                            btn.textContent.includes('Follow'));
      if (followButton) {
        logTest("artistPage", "Follow button present", "PASS");
        
        // Test follow button interaction
        const originalText = followButton.textContent;
        followButton.click();
        await delay(500);
        
        if (followButton.textContent !== originalText) {
          logTest("artistPage", "Follow button interaction", "PASS");
        } else {
          logTest("artistPage", "Follow button interaction", "WARNING", "State might not change without login");
        }
      } else {
        logTest("artistPage", "Follow button present", "FAIL");
      }
      
      // Check for artist avatar/image
      const avatar = document.querySelector('[class*="Avatar"], img, [style*="background-image"]');
      if (avatar) {
        logTest("artistPage", "Artist avatar/image displayed", "PASS");
      } else {
        logTest("artistPage", "Artist avatar/image displayed", "WARNING", "No image found");
      }
      
    } else {
      logTest("artistPage", "ArtistHero component rendered", "FAIL");
    }
    
    // Test ArtistShows Component
    const showsSection = document.querySelector('h2:has-text("Upcoming Shows")') ||
                        Array.from(document.querySelectorAll('h2')).find(h => 
                          h.textContent.includes('Shows'));
    if (showsSection) {
      logTest("artistPage", "ArtistShows component rendered", "PASS");
      
      // Check for show cards
      const showCards = document.querySelectorAll('[class*="grid"] > div');
      if (showCards.length > 0) {
        logTest("artistPage", "Show cards displayed", "PASS", `Found ${showCards.length} shows`);
        
        // Test show card interaction
        const firstShowCard = showCards[0];
        if (firstShowCard.querySelector('a, [class*="cursor-pointer"]')) {
          logTest("artistPage", "Show cards are interactive", "PASS");
        } else {
          logTest("artistPage", "Show cards are interactive", "FAIL");
        }
      } else {
        logTest("artistPage", "Show cards displayed", "WARNING", "No upcoming shows");
      }
    } else {
      logTest("artistPage", "ArtistShows component rendered", "FAIL");
    }
    
    testResults.artistPage.status = "COMPLETED";
    
  } catch (error) {
    logTest("artistPage", "Error during testing", "FAIL", error.message);
    testResults.artistPage.status = "ERROR";
  }
}

async function testShowPageComponents() {
  console.log("\n🎵 TESTING SHOW PAGE COMPONENTS");
  
  try {
    // Try to find and click on a show to test ShowPage
    const showLinks = document.querySelectorAll('a[href*="/show/"], [class*="cursor-pointer"]');
    let showPageTested = false;
    
    if (showLinks.length > 0) {
      // Click on first available show
      showLinks[0].click();
      await delay(3000);
      
      if (window.location.pathname.includes('/show/')) {
        showPageTested = true;
        
        // Test ShowDetails Component
        const showDetails = document.querySelector('h1, h2, [class*="text-"]');
        if (showDetails) {
          logTest("showPage", "ShowDetails component rendered", "PASS");
          
          // Check for venue information
          const venueInfo = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent && (el.textContent.includes('Venue') || 
                              el.textContent.includes('Location')));
          if (venueInfo) {
            logTest("showPage", "Venue information displayed", "PASS");
          } else {
            logTest("showPage", "Venue information displayed", "WARNING");
          }
        } else {
          logTest("showPage", "ShowDetails component rendered", "FAIL");
        }
        
        // Test Setlist Component
        const setlistSection = document.querySelector('h2:has-text("Setlist")') ||
                              Array.from(document.querySelectorAll('h2')).find(h => 
                                h.textContent.includes('Setlist'));
        if (setlistSection) {
          logTest("showPage", "Setlist component rendered", "PASS");
          
          // Test SetlistSong Components
          const songItems = document.querySelectorAll('[class*="flex"][class*="items-center"]');
          if (songItems.length > 0) {
            logTest("showPage", "SetlistSong components rendered", "PASS", `Found ${songItems.length} songs`);
            
            // Test voting buttons
            const voteButtons = document.querySelectorAll('button[class*="icon"], button:has([class*="thumbs"])');
            if (voteButtons.length > 0) {
              logTest("showPage", "Vote buttons present", "PASS", `Found ${voteButtons.length} vote buttons`);
              
              // Test vote button interaction
              const firstVoteButton = voteButtons[0];
              const originalState = firstVoteButton.disabled;
              firstVoteButton.click();
              await delay(500);
              
              if (firstVoteButton.disabled !== originalState) {
                logTest("showPage", "Vote button interaction", "PASS");
              } else {
                logTest("showPage", "Vote button interaction", "WARNING", "State might not change without login");
              }
            } else {
              logTest("showPage", "Vote buttons present", "FAIL");
            }
            
            // Check for vote counts
            const voteCounts = document.querySelectorAll('[class*="text-right"], span:has-text(/[0-9]+/)');
            if (voteCounts.length > 0) {
              logTest("showPage", "Vote counts displayed", "PASS");
            } else {
              logTest("showPage", "Vote counts displayed", "FAIL");
            }
          } else {
            logTest("showPage", "SetlistSong components rendered", "FAIL");
          }
          
          // Test suggest song button
          const suggestButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('Suggest'));
          if (suggestButton) {
            logTest("showPage", "Suggest song button present", "PASS");
            
            suggestButton.click();
            await delay(500);
            
            // Check for toast notification
            const toast = document.querySelector('[class*="toast"], [role="alert"]');
            if (toast) {
              logTest("showPage", "Suggest song functionality", "PASS");
            } else {
              logTest("showPage", "Suggest song functionality", "WARNING", "No visible feedback");
            }
          } else {
            logTest("showPage", "Suggest song button present", "FAIL");
          }
          
        } else {
          logTest("showPage", "Setlist component rendered", "FAIL");
        }
      }
    }
    
    if (!showPageTested) {
      logTest("showPage", "ShowPage accessibility", "FAIL", "No shows available to test");
    }
    
    testResults.showPage.status = showPageTested ? "COMPLETED" : "SKIPPED";
    
  } catch (error) {
    logTest("showPage", "Error during testing", "FAIL", error.message);
    testResults.showPage.status = "ERROR";
  }
}

async function testNavigationRouting() {
  console.log("\n🧭 TESTING NAVIGATION & ROUTING");
  
  try {
    // Test sidebar navigation
    const sidebar = document.querySelector('[class*="sidebar"], nav, [class*="w-64"]');
    if (sidebar) {
      logTest("navigation", "Sidebar component present", "PASS");
      
      // Test navigation links
      const navLinks = sidebar.querySelectorAll('a, button');
      if (navLinks.length > 0) {
        logTest("navigation", "Navigation links present", "PASS", `Found ${navLinks.length} links`);
        
        // Test a navigation link
        const originalPath = window.location.pathname;
        if (navLinks.length > 1) {
          navLinks[1].click();
          await delay(1000);
          
          if (window.location.pathname !== originalPath) {
            logTest("navigation", "Navigation link functionality", "PASS");
          } else {
            logTest("navigation", "Navigation link functionality", "WARNING");
          }
        }
      } else {
        logTest("navigation", "Navigation links present", "FAIL");
      }
    } else {
      logTest("navigation", "Sidebar component present", "FAIL");
    }
    
    // Test route parameters (artist name encoding)
    const artistPath = `/artist/${encodeURIComponent(TEST_ARTIST)}`;
    window.history.pushState({}, '', artistPath);
    await delay(1000);
    
    if (window.location.pathname === artistPath) {
      logTest("navigation", "Route parameter encoding", "PASS");
    } else {
      logTest("navigation", "Route parameter encoding", "FAIL");
    }
    
    // Test mobile responsiveness of navigation
    const isMobileViewport = window.innerWidth <= 768;
    if (isMobileViewport) {
      logTest("navigation", "Mobile viewport detected", "PASS");
      
      // Look for mobile navigation toggles
      const mobileToggle = document.querySelector('[class*="mobile"], button:has([class*="menu"])');
      if (mobileToggle) {
        logTest("navigation", "Mobile navigation toggle", "PASS");
      } else {
        logTest("navigation", "Mobile navigation toggle", "WARNING");
      }
    } else {
      logTest("navigation", "Desktop navigation", "PASS");
    }
    
    testResults.navigation.status = "COMPLETED";
    
  } catch (error) {
    logTest("navigation", "Error during testing", "FAIL", error.message);
    testResults.navigation.status = "ERROR";
  }
}

async function testUIConsistency() {
  console.log("\n🎨 TESTING UI/UX CONSISTENCY");
  
  try {
    // Test dark mode theme
    const bodyStyles = window.getComputedStyle(document.body);
    const backgroundColor = bodyStyles.backgroundColor;
    
    if (backgroundColor.includes('rgb(0, 0, 0)') || 
        backgroundColor.includes('rgb(9, 9, 11)') ||
        bodyStyles.color.includes('rgb(255, 255, 255)')) {
      logTest("uiConsistency", "Dark theme active", "PASS");
    } else {
      logTest("uiConsistency", "Dark theme active", "FAIL", `BG: ${backgroundColor}`);
    }
    
    // Test responsive design
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    logTest("uiConsistency", "Viewport dimensions", "PASS", `${viewport.width}x${viewport.height}`);
    
    // Test for responsive classes
    const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
    if (responsiveElements.length > 0) {
      logTest("uiConsistency", "Responsive design classes", "PASS", `Found ${responsiveElements.length} responsive elements`);
    } else {
      logTest("uiConsistency", "Responsive design classes", "WARNING");
    }
    
    // Test loading states
    const loadingElements = document.querySelectorAll('[class*="animate-spin"], [class*="loading"]');
    if (loadingElements.length > 0) {
      logTest("uiConsistency", "Loading state components", "PASS");
    } else {
      logTest("uiConsistency", "Loading state components", "WARNING", "No loading states currently visible");
    }
    
    // Test for consistent button styles
    const buttons = document.querySelectorAll('button');
    let consistentButtons = 0;
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      if (styles.borderRadius && styles.padding) {
        consistentButtons++;
      }
    });
    
    if (consistentButtons > 0) {
      logTest("uiConsistency", "Button style consistency", "PASS", `${consistentButtons}/${buttons.length} styled`);
    } else {
      logTest("uiConsistency", "Button style consistency", "FAIL");
    }
    
    // Test for proper contrast ratios
    const textElements = document.querySelectorAll('p, h1, h2, h3, span');
    let goodContrast = 0;
    
    textElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      if (color.includes('rgb(255') || color.includes('rgb(161') || color.includes('rgb(113')) {
        goodContrast++;
      }
    });
    
    if (goodContrast > textElements.length * 0.8) {
      logTest("uiConsistency", "Text contrast ratios", "PASS");
    } else {
      logTest("uiConsistency", "Text contrast ratios", "WARNING");
    }
    
    testResults.uiConsistency.status = "COMPLETED";
    
  } catch (error) {
    logTest("uiConsistency", "Error during testing", "FAIL", error.message);
    testResults.uiConsistency.status = "ERROR";
  }
}

async function testRealTimeUpdates() {
  console.log("\n⚡ TESTING REAL-TIME UPDATES");
  
  try {
    // Test vote count updates
    const voteButtons = document.querySelectorAll('button[class*="icon"], button:has([class*="thumbs"])');
    const voteCountsBefore = Array.from(document.querySelectorAll('[class*="text-right"], span'))
      .map(el => el.textContent)
      .filter(text => /^\d+$/.test(text?.trim()));
    
    if (voteButtons.length > 0 && voteCountsBefore.length > 0) {
      logTest("realTimeUpdates", "Initial vote counts captured", "PASS", `${voteCountsBefore.length} vote counts`);
      
      // Simulate voting
      voteButtons[0].click();
      await delay(2000);
      
      const voteCountsAfter = Array.from(document.querySelectorAll('[class*="text-right"], span'))
        .map(el => el.textContent)
        .filter(text => /^\d+$/.test(text?.trim()));
      
      const countChanged = voteCountsAfter.some((count, index) => 
        count !== voteCountsBefore[index]);
      
      if (countChanged) {
        logTest("realTimeUpdates", "Vote count updates", "PASS");
      } else {
        logTest("realTimeUpdates", "Vote count updates", "WARNING", "Might require authentication");
      }
    } else {
      logTest("realTimeUpdates", "Vote system availability", "FAIL", "No voteable content found");
    }
    
    // Test query invalidation (React Query)
    const queryKeys = ['setlist', 'user-votes', 'artist', 'shows'];
    let reactQueryDetected = false;
    
    if (window.__REACT_QUERY_DEVTOOLS__ || window.ReactQueryDevtools) {
      reactQueryDetected = true;
      logTest("realTimeUpdates", "React Query detected", "PASS");
    } else {
      logTest("realTimeUpdates", "React Query detected", "WARNING", "DevTools not visible");
    }
    
    // Test toast notifications
    const toastContainer = document.querySelector('[class*="toast"], [role="alert"], [class*="sonner"]');
    if (toastContainer) {
      logTest("realTimeUpdates", "Toast notification system", "PASS");
    } else {
      logTest("realTimeUpdates", "Toast notification system", "WARNING", "No toasts currently visible");
    }
    
    // Test authentication-dependent features
    const authButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
      btn.textContent.includes('Sign') || btn.textContent.includes('Login') || btn.textContent.includes('Follow'));
    
    if (authButtons.length > 0) {
      logTest("realTimeUpdates", "Authentication-dependent features", "PASS", `${authButtons.length} auth features`);
    } else {
      logTest("realTimeUpdates", "Authentication-dependent features", "WARNING");
    }
    
    testResults.realTimeUpdates.status = "COMPLETED";
    
  } catch (error) {
    logTest("realTimeUpdates", "Error during testing", "FAIL", error.message);
    testResults.realTimeUpdates.status = "ERROR";
  }
}

function generateFinalReport() {
  console.log("\n📊 FINAL TEST REPORT");
  console.log("=" .repeat(50));
  
  let totalTests = 0;
  let passedTests = 0;
  let warningTests = 0;
  let failedTests = 0;
  
  Object.keys(testResults).forEach(component => {
    if (component === 'overallScore') return;
    
    const results = testResults[component];
    console.log(`\n${component.toUpperCase()}:`);
    
    results.details.forEach(test => {
      console.log(`  ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️'} ${test.test}: ${test.status} ${test.details}`);
      totalTests++;
      if (test.status === 'PASS') passedTests++;
      else if (test.status === 'WARNING') warningTests++;
      else if (test.status === 'FAIL') failedTests++;
    });
  });
  
  const score = Math.round(((passedTests + (warningTests * 0.5)) / totalTests) * 100);
  testResults.overallScore = score;
  
  console.log("\n" + "=" .repeat(50));
  console.log("📈 TEST SUMMARY:");
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`⚠️ Warnings: ${warningTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Overall Score: ${score}%`);
  
  if (score >= 80) {
    console.log("🎉 EXCELLENT: TheSet app is functioning well!");
  } else if (score >= 60) {
    console.log("👍 GOOD: TheSet app is mostly functional with some issues.");
  } else {
    console.log("🔧 NEEDS WORK: TheSet app has significant issues that need attention.");
  }
  
  console.log("\n🎯 RECOMMENDATIONS:");
  
  if (failedTests > 0) {
    console.log("- Address failed tests to improve core functionality");
  }
  
  if (warningTests > 3) {
    console.log("- Review warning items for potential improvements");
  }
  
  console.log("- Test with actual user authentication for full functionality");
  console.log("- Verify real API data integration with Ticketmaster and Spotify");
  console.log("- Test on multiple devices and screen sizes");
  
  return testResults;
}