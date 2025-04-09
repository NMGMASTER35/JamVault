import { useState, useEffect } from "react";
import { Check, Sun, Moon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

const THEME_KEY = "jamvault-theme";

// Available theme options
const THEMES = {
  "red-blue": {
    name: "Classic",
    primary: "#ff5555",
    description: "Red & blue tones",
    mode: "dark",
  },
  "purple-pink": {
    name: "Neon Nights",
    primary: "#9333ea",
    description: "Purple & pink gradients",
    mode: "dark",
  },
  "green-teal": {
    name: "Forest",
    primary: "#059669",
    description: "Green & teal accents",
    mode: "dark",
  },
  "blue-slate": {
    name: "Ocean",
    primary: "#3b82f6",
    description: "Blue & slate accents",
    mode: "light",
  },
  "amber-orange": {
    name: "Sunset",
    primary: "#f59e0b",
    description: "Amber & orange accents",
    mode: "light",
  },
};

type ThemeType = keyof typeof THEMES;

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeType>("red-blue");
  
  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeType;
    if (savedTheme && THEMES[savedTheme]) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme("red-blue");
    }
  }, []);
  
  // Apply theme to document and save to localStorage
  const applyTheme = (selectedTheme: ThemeType) => {
    const themeConfig = THEMES[selectedTheme];
    
    // Set theme mode (light/dark)
    if (themeConfig.mode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    
    // Apply primary color to CSS variables
    document.documentElement.style.setProperty("--primary", themeConfig.primary);
    
    // Save theme preference
    localStorage.setItem(THEME_KEY, selectedTheme);
  };
  
  const onThemeChange = (value: string) => {
    const newTheme = value as ThemeType;
    setTheme(newTheme);
    applyTheme(newTheme);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Change theme">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={onThemeChange}>
          {Object.entries(THEMES).map(([key, value]) => (
            <DropdownMenuRadioItem 
              key={key} 
              value={key}
              className="flex items-center gap-2 py-2 cursor-pointer"
            >
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: value.primary }}
              />
              <div className="flex flex-col">
                <span className="font-medium">{value.name}</span>
                <span className="text-xs text-muted-foreground">{value.description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onThemeChange(THEMES[theme].mode === "dark" ? "blue-slate" : "red-blue")}
          className="cursor-pointer"
        >
          {THEMES[theme].mode === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          <span>Switch to {THEMES[theme].mode === "dark" ? "Light" : "Dark"} Mode</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}