import { useState } from "react"
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native"

import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { FieldLabel } from "./FieldLabel"
import { useScheme } from "./scheme"

export type TextFieldKind = "text" | "name" | "email" | "password"

export type TextFieldProps = Omit<TextInputProps, "style"> & { label: string; kind?: TextFieldKind }

const KIND: Record<TextFieldKind, TextInputProps> = {
  text: {},
  name: { textContentType: "name", autoComplete: "name", autoCapitalize: "words" },
  email: {
    keyboardType: "email-address",
    textContentType: "emailAddress",
    autoComplete: "email",
    autoCapitalize: "none",
    autoCorrect: false,
  },
  password: {
    secureTextEntry: true,
    textContentType: "password",
    autoComplete: "password",
    autoCapitalize: "none",
    autoCorrect: false,
  },
}

// pill input under a mono label; focus draws the 1px ring at 2px offset (DESIGN.md §11)
export const TextField = ({ label, kind = "text", onFocus, onBlur, ...input }: TextFieldProps) => {
  const { c } = useScheme()
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.group}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.fg3}
        returnKeyType="done"
        {...KIND[kind]}
        {...input}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        style={[
          type.body,
          styles.input,
          {
            color: c.fg1,
            backgroundColor: c.surfaceCard,
            boxShadow: `inset 0 0 0 1px ${c.separator}`,
          },
          focused && { outlineWidth: 1, outlineColor: c.focusRing, outlineOffset: 2 },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  group: { gap: space.s },
  input: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderCurve: "continuous",
  },
})
