import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * The photo-scorer term with its explainer — an infotip, not a tooltip: the
 * trigger's only purpose is to show the explainer. Popover with `openOnHover`
 * is base-ui's recommended pattern for that; hover, touch taps, and keyboard
 * all open it natively, and focus moves into the popup so screen readers
 * reach the content.
 */
export function ScorerTerm() {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={150}
        render={
          <button
            type="button"
            className="cursor-pointer p-0 underline decoration-dotted underline-offset-4"
          />
        }
      >
        photo scorer
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={4} className="w-60 gap-1 p-2 text-xs">
        <PopoverHeader className="text-xs">
          <PopoverTitle>Photo scorer</PopoverTitle>
          <PopoverDescription>
            Compares your photo to today&apos;s hidden subject on this device, 0 to 100%.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}
