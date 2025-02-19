import { ArtistSearchBar } from "../components/search/ArtistSearchBar";
import { useNavigate } from "react-router-dom";

const ArtistSearchIntegration = () => {
  const navigate = useNavigate();

  const handleArtistClick = (artistName: string) => {
    const encodedName = artistName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    console.log('Navigating to artist:', encodedName);
    navigate(`/artist/${encodedName}`);
  };

  return (
    <ArtistSearchBar onArtistClick={handleArtistClick} />
  );
};

export default ArtistSearchIntegration;
