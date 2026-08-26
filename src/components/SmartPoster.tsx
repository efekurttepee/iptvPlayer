import React, { useState, useEffect } from 'react';
import { Film, Clapperboard, Tv } from 'lucide-react';
import { getSmartMediaPoster } from '../services/posterScraperService';

interface SmartPosterProps {
  initialUrl?: string | null;
  title: string;
  isSeries?: boolean;
  alt?: string;
  className?: string;
  fallbackIcon?: 'film' | 'clapperboard' | 'tv';
}

export const SmartPoster: React.FC<SmartPosterProps> = ({
  initialUrl,
  title,
  isSeries = false,
  alt = '',
  className = 'w-full h-full object-cover',
  fallbackIcon = isSeries ? 'clapperboard' : 'film',
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialUrl || null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Eğer IPTV'den gelen geçerli bir görsel URL'si yoksa akıllı aramayı başlat
    if (!initialUrl || !initialUrl.startsWith('http')) {
      setIsSearching(true);
      getSmartMediaPoster(title, isSeries)
        .then((scrapedUrl) => {
          if (!isMounted) return;
          if (scrapedUrl) {
            setImageSrc(scrapedUrl);
            setHasFailed(false);
          } else {
            setImageSrc(null);
            setHasFailed(true);
          }
          setIsSearching(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setIsSearching(false);
          setHasFailed(true);
        });
    } else {
      setImageSrc(initialUrl);
      setHasFailed(false);
    }

    return () => {
      isMounted = false;
    };
  }, [initialUrl, title, isSeries]);

  // IPTV'den gelen link 404, 403 veya bozuk görsel verirse devreye giren akıllı kurtarıcı
  const handleImageError = async () => {
    if (isSearching) return;
    setIsSearching(true);
    try {
      const fallbackUrl = await getSmartMediaPoster(title, isSeries);
      if (fallbackUrl && fallbackUrl !== imageSrc) {
        setImageSrc(fallbackUrl);
        setHasFailed(false);
      } else {
        setImageSrc(null);
        setHasFailed(true);
      }
    } catch {
      setHasFailed(true);
    } finally {
      setIsSearching(false);
    }
  };

  // İkon fallback seçimi
  const renderFallbackIcon = () => {
    switch (fallbackIcon) {
      case 'clapperboard':
        return <Clapperboard className="w-8 h-8 text-gray-500" />;
      case 'tv':
        return <Tv className="w-8 h-8 text-gray-500" />;
      case 'film':
      default:
        return <Film className="w-8 h-8 text-gray-500" />;
    }
  };

  if (hasFailed || (!imageSrc && !isSearching)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#151922] text-gray-500">
        {renderFallbackIcon()}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#12151e] overflow-hidden flex items-center justify-center">
      {isSearching && !imageSrc && (
        <div className="absolute inset-0 bg-[#161a24] animate-pulse flex items-center justify-center">
          {renderFallbackIcon()}
        </div>
      )}

      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt || title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className={className}
        />
      )}
    </div>
  );
};
