import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { label: "English", value: "en" },
  { label: "Español", value: "es" },
  { label: "简体中文", value: "zh-CN" },
  { label: "繁體中文", value: "zh-TW" },
  { label: "हिंदी", value: "hi" },
  { label: "العربية", value: "ar" },
  { label: "Français", value: "fr" },
  { label: "Deutsch", value: "de" },
  { label: "Italiano", value: "it" },
  { label: "日本語", value: "ja" },
  { label: "한국어", value: "ko" },
  { label: "Português", value: "pt" },
  { label: "Русский", value: "ru" },
  { label: "Türkçe", value: "tr" },
  { label: "Tiếng Việt", value: "vi" },
  { label: "ไทย", value: "th" },
  { label: "Nederlands", value: "nl" },
];

export function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return languages.find((lang) => lang.value === i18n.language) || languages[0];
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedLanguage.label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup>
            {languages.map((language) => (
              <CommandItem
                key={language.value}
                value={language.value}
                onSelect={() => {
                  i18n.changeLanguage(language.value);
                  setSelectedLanguage(language);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedLanguage.value === language.value
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {language.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}