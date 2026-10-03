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
}: Props) => (
  <View style={styles.group}>
    <Text style={[type.caption, styles.label]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      keyboardType={email ? "email-address" : "default"}
      textContentType={email ? "emailAddress" : "name"}
      autoCapitalize={email ? "none" : "words"}
      autoCorrect={!email}
      autoFocus={autoFocus}
      returnKeyType="done"
      onSubmitEditing={onSubmitEditing}
      style={[type.body, styles.input]}
    />
  </View>
)

const styles = StyleSheet.create({
  group: { gap: space.s },
  label: { color: colors.textSecondary, textTransform: "uppercase" },
  input: {
    minHeight: 54,
    paddingHorizontal: space.l,
    borderRadius: radius.button,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.separator,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceRaised,
  },
})
