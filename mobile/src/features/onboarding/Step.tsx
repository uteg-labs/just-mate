import { type ReactNode, use } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"

import { useScheme } from "@/components/ui"
import { space } from "@/theme/layout"
import { type } from "@/theme/type"

import { SaveContext } from "./flow"

type Props = {
  eyebrow?: string
  title?: string
  sub?: string
  caption?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  cta: ReactNode
}

// DESIGN.md §13.6 — scrolling content, footer and CTA pinned at the bottom
export const Step = ({ eyebrow, title, sub, caption, children, footer, cta }: Props) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const { isSaving, hasFailed } = use(SaveContext)

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {eyebrow && <Text style={[type.mono, { color: c.fg2 }]}>{eyebrow}</Text>}
        {title && (
          <Text accessibilityRole="header" style={[type.largeTitle, { color: c.fg1 }]}>
            {title}
          </Text>
        )}
        {caption}
        {sub && <Text style={[type.body, { color: c.fg2 }]}>{sub}</Text>}
        {children}
      </ScrollView>
      <View
        style={[styles.footer, isSaving && styles.busy]}
        pointerEvents={isSaving ? "none" : "auto"}
      >
        {hasFailed && (
          <Text
            accessibilityLiveRegion="polite"
            style={[type.footnote, styles.center, { color: c.fg2 }]}
          >
            {t("onboarding.saveError")}
          </Text>
        )}
        {footer}
        {cta}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, marginHorizontal: -space.xs },
  content: {
    gap: space.l,
    paddingTop: 20,
    paddingBottom: space.xs,
    paddingHorizontal: space.xs,
  },
  footer: { gap: 10, paddingTop: 14 },
  busy: { opacity: 0.4 },
  center: { textAlign: "center" },
})
