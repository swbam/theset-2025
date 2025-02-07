
import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  
  if (paths.length === 0) return null;

  const breadcrumbs = paths.map((path, index) => {
    const url = `/${paths.slice(0, index + 1).join('/')}`;
    const formattedPath = path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      name: formattedPath,
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
