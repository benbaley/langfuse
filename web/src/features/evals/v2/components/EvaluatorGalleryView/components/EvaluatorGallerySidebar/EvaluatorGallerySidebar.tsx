import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/utils/tailwind";
import { getGalleryCategoryPresentation } from "@/src/features/evals/v2/fns/templateGallery/galleryCategoryPresentation";
import type { GalleryNavigationItem } from "@/src/features/evals/v2/types/templateGallery";
import { useTranslation } from "react-i18next";

export function EvaluatorGallerySidebar({
  items,
  activeSection,
  onSelectSection,
}: {
  items: GalleryNavigationItem[];
  activeSection: string | null;
  onSelectSection: (key: string) => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  const selectedSection = activeSection ?? items[0]?.key;
  const selectedItem = items.find((item) => item.key === selectedSection);

  return (
    <>
      <nav
        aria-label={tFeatures("ui.browseCategories")}
        className="hidden w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-r p-4 @2xl:flex"
      >
        <div className="text-muted-foreground px-3 pb-2 text-xs font-bold tracking-wide uppercase">
          {tFeatures("ui.browse")}
        </div>
        {items.map((item) => {
          const isActive = selectedSection === item.key;
          const { icon: FallbackIcon, iconClassName } =
            getGalleryCategoryPresentation(item.key);
          const Icon = item.icon ?? FallbackIcon;

          return (
            <Button
              key={item.key}
              type="button"
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "font-regular h-8 justify-start px-3",
                isActive
                  ? "hover:bg-secondary"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelectSection(item.key)}
            >
              <Icon
                className={cn("mr-2 h-3.5 w-3.5 shrink-0", iconClassName)}
              />
              <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <span
                  className="truncate"
                  title={tFeatures(`evalsMore:gallery.category.${item.key}`, {
                    defaultValue: item.label,
                  })}
                >
                  {tFeatures(`evalsMore:gallery.category.${item.key}`, {
                    defaultValue: item.label,
                  })}
                </span>
                {item.count !== undefined ? (
                  <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                    {item.count}
                  </span>
                ) : null}
              </span>
            </Button>
          );
        })}
      </nav>

      <nav
        aria-label={tFeatures("ui.browseCategories")}
        className="border-b p-3 @2xl:hidden"
      >
        <Select value={selectedSection} onValueChange={onSelectSection}>
          <SelectTrigger
            aria-label={tFeatures("ui.browseCategories")}
            className="w-full"
          >
            <SelectValue placeholder={tFeatures("ui.browseCategories")}>
              {selectedItem
                ? tFeatures(`evalsMore:gallery.category.${selectedItem.key}`, {
                    defaultValue: selectedItem.label,
                  })
                : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem
                key={item.key}
                value={item.key}
                className="[&>span:last-child]:w-full"
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span
                    className="truncate"
                    title={tFeatures(`evalsMore:gallery.category.${item.key}`, {
                      defaultValue: item.label,
                    })}
                  >
                    {tFeatures(`evalsMore:gallery.category.${item.key}`, {
                      defaultValue: item.label,
                    })}
                  </span>
                  {item.count !== undefined ? (
                    <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                      {item.count}
                    </span>
                  ) : null}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </nav>
    </>
  );
}
