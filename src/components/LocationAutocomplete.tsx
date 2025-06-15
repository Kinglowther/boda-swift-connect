
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MapPin, Building, ShoppingCart, Navigation, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationSuggestion {
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  category?: string;
  place_id?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: { lat: number; lng: number }, displayName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter location...",
  disabled = false,
  className
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Use Nominatim (OpenStreetMap) for geocoding - it's free and doesn't require API key
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query + ', Kenya')}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=8&` +
        `countrycodes=ke&` +
        `dedupe=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      
      // Transform and filter results
      const transformedSuggestions: LocationSuggestion[] = data
        .filter((item: any) => item.lat && item.lon)
        .map((item: any) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type || 'location',
          category: item.category,
          place_id: item.place_id
        }));
      
      setSuggestions(transformedSuggestions);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        searchLocations(value.trim());
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, searchLocations]);

  const getLocationIcon = (type: string, category?: string) => {
    if (category === 'shop' || type === 'shop') return <ShoppingCart className="h-4 w-4 text-blue-500" />;
    if (category === 'building' || type === 'building') return <Building className="h-4 w-4 text-gray-500" />;
    if (type === 'highway' || type === 'road') return <Navigation className="h-4 w-4 text-green-500" />;
    return <MapPin className="h-4 w-4 text-red-500" />;
  };

  const formatDisplayName = (displayName: string) => {
    // Clean up the display name to make it more readable
    const parts = displayName.split(',');
    if (parts.length > 3) {
      return parts.slice(0, 3).join(', ') + '...';
    }
    return displayName;
  };

  const formatSelectedName = (displayName: string) => {
    // For selected location, extract just the essential name for mobile
    const parts = displayName.split(',');
    let mainName = parts[0].trim();
    
    // Remove common location type words that make names too long
    mainName = mainName.replace(/^(MP|TRM|Avenue|Road|Street|Drive|Highway)\s+/i, '');
    mainName = mainName.replace(/\s+(Hospital|Mall|Center|Centre|Market|Plaza|Building|School|High School|Preparatory School|Boys|Girls)$/i, '');
    
    // Extract key words if it's still a school or institution
    if (mainName.toLowerCase().includes('school')) {
      const schoolMatch = mainName.match(/(\w+(?:\s+\w+)?)\s+.*school/i);
      if (schoolMatch) {
        mainName = schoolMatch[1];
      }
    }
    
    // For roads, just take the road name without "Road"
    if (mainName.toLowerCase().includes('road')) {
      mainName = mainName.replace(/\s+road$/i, '').trim();
    }
    
    // If still too long, truncate aggressively for mobile (max 15 characters)
    if (mainName.length > 15) {
      mainName = mainName.substring(0, 12) + '...';
    }
    
    return mainName;
  };

  const handleSelect = (suggestion: LocationSuggestion) => {
    const formattedName = formatSelectedName(suggestion.display_name);
    onChange(formattedName);
    onLocationSelect(
      { lat: suggestion.lat, lng: suggestion.lon }, 
      suggestion.display_name // Pass full name to context but display shortened version
    );
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <MapPin className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{value || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search locations..."
            value={value}
            onValueChange={onChange}
          />
          <CommandList>
            {isLoading && (
              <CommandEmpty>
                <div className="flex items-center justify-center p-4">
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Searching locations...
                </div>
              </CommandEmpty>
            )}
            {!isLoading && suggestions.length === 0 && value.length >= 2 && (
              <CommandEmpty>No locations found.</CommandEmpty>
            )}
            {!isLoading && suggestions.length > 0 && (
              <CommandGroup>
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={`${suggestion.place_id || index}`}
                    value={suggestion.display_name}
                    onSelect={() => handleSelect(suggestion)}
                    className="flex items-start gap-2 p-3"
                  >
                    {getLocationIcon(suggestion.type, suggestion.category)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {formatDisplayName(suggestion.display_name)}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {suggestion.category || suggestion.type}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default LocationAutocomplete;
