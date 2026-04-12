import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { WeatherQuerySchema } from '@weathered/shared'

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
    <form className="p-6 border border-black" action={handleSubmit}>
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="search-city">Search City</FieldLabel>
        <ButtonGroup>
          <Input
            id="search-city"
            type="text"
            name="city"
            placeholder="Sydney"
          />
          <Button variant="outline" type="submit">
            Search
          </Button>
        </ButtonGroup>
        <FieldError>{error}</FieldError>
      </Field>
    </form>
  )
}
