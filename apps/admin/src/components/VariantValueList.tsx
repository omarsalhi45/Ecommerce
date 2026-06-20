import {
  Badge,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react'

interface VariantValueListProps {
  addButtonLabel: string
  emptyLabel: string
  inputLabel: string
  options: readonly string[]
  placeholder: string
  value: string
  values: readonly string[]
  onAdd: () => void
  onChange: (value: string) => void
  onRemove: (value: string) => void
}

export function VariantValueList({
  addButtonLabel,
  emptyLabel,
  inputLabel,
  options,
  placeholder,
  value,
  values,
  onAdd,
  onChange,
  onRemove,
}: VariantValueListProps) {
  return (
    <FormControl>
      <FormLabel color="neutral.600" fontSize="sm" fontWeight="bold">
        {inputLabel}
      </FormLabel>
      <HStack>
        <Select
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} disabled={values.includes(option)} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Button
          flexShrink={0}
          isDisabled={!value || values.includes(value)}
          variant="outline"
          onClick={onAdd}
        >
          {addButtonLabel}
        </Button>
      </HStack>
      <Stack align="start" direction="row" flexWrap="wrap" gap={2} mt={2} spacing={0}>
        {values.length > 0 ? (
          values.map((item) => (
            <Badge
              key={item}
              borderRadius="full"
              colorScheme="gray"
              px={2}
              py={1}
              textTransform="none"
            >
              <HStack spacing={1}>
                <Text as="span">{item}</Text>
                <Button
                  aria-label={`Remove ${item}`}
                  h="auto"
                  minW={0}
                  p={0}
                  size="xs"
                  variant="ghost"
                  onClick={() => onRemove(item)}
                >
                  x
                </Button>
              </HStack>
            </Badge>
          ))
        ) : (
          <Text color="neutral.500" fontSize="xs">
            {emptyLabel}
          </Text>
        )}
      </Stack>
    </FormControl>
  )
}
