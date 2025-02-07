import { useLocation, Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs() {
  const location = useLocation();
  const { artistName } = useParams();
  const paths = location.pathname.split('/').filter(Boolean);
  
  if (paths.length === 0) return null;

  const breadcrumbs = paths.map((path, index) => {
    const url = `/${paths.slice(0, index + 1).join('/')}`;
    
    // Format the path text
    let displayText = path;
    
    // Special handling for artist names and show paths
    if (path === 'artist' && paths[index + 1]) {
      displayText = 'Artist';
    } else if (path === artistName) {
      displayText = decodeURIComponent(path).replace(/-/g, ' ');
    } else if (path === 'show') {
      displayText = 'Show';
    } else if (index === paths.length - 1 && paths[index - 1] === 'show') {
      // This is the show title, keep it as is
      displayText = 'Details';
    } else {
      displayText = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return {
      name: displayText,
      url,
    };
  });

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
      <Link to="/" className="hover:text-foreground">
        Home
      </Link>
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.url} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <Link
            to={crumb.url}
            className={index === breadcrumbs.length - 1 ? "text-foreground" : "hover:text-foreground"}
          >
            {crumb.name}
          </Link>
        </div>
      ))}
    </div>
  );
}
