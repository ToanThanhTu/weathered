import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { WeatherQuerySchema } from '@weathered/shared'
import { useState } from 'react'

interface SearchBarProps {
  onSearch: (city: string) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    const parsedInput = WeatherQuerySchema.safeParse({
      city: formData.get('city'),
    })

    if (!parsedInput.success) {
      setError(parsedInput.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    onSearch(parsedInput.data.city)
    setError(null)
  }

  return (
    <form action={handleSubmit}>
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel
          htmlFor="search-city"
          className="text-xs uppercase tracking-widest text-muted-foreground"
        >
          Search City
        </FieldLabel>
        <ButtonGroup>
          <Input
            id="search-city"
            type="text"
            name="city"
            placeholder="Sydney, London, Tokyo..."
            className="h-12 border-2 text-base focus-visible:ring-rfs-red md:text-base"
          />
          <Button
            type="submit"
            className="h-12 bg-foreground px-6 text-base text-background hover:bg-rfs-red"
          >
            Search
          </Button>
        </ButtonGroup>
        <FieldError>{error}</FieldError>
      </Field>
    </form>
  )
}
