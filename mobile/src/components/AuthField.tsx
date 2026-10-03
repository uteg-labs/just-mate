import { useState } from "react"
import { StyleSheet, Text, TextInput, View } from "react-native"

import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

type Props = {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder: string
  email?: boolean
  autoFocus?: boolean
  onSubmitEditing?: () => void
}

export const AuthField = ({
  label,
  value,
  onChangeText,
  placeholder,
  email,
  autoFocus,
  onSubmitEditing,
}: Props) => {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.group}>
      <Text style={[type.mono, styles.label]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.fg3}
        keyboardType={email ? "email-address" : "default"}
        textContentType={email ? "emailAddress" : "name"}
        autoCapitalize={email ? "none" : "words"}
        autoCorrect={!email}
        autoFocus={autoFocus}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[type.body, styles.input, focused && styles.focused]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  group: { gap: space.s },
  label: { color: colors.fg2, paddingHorizontal: space.l },
  input: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    color: colors.fg1,
    backgroundColor: colors.surfaceCard,
    boxShadow: `inset 0 0 0 1px ${colors.separator}`,
  },
  focused: { outlineWidth: 1, outlineColor: colors.focusRing, outlineOffset: 2 },
})
