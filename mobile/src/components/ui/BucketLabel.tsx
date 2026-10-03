import type { Bucket } from "@justmate/protocol"
import { StyleSheet, Text, View } from "react-native"

import type { Palette } from "@/theme/colors"
import { radius } from "@/theme/layout"
import { type } from "@/theme/type"

import { useScheme } from "./scheme"

// DESIGN.md §3.5 — metal heating up; burning is white-hot with a temp-hot ring
export const BUCKET_COLOR: Record<Bucket, keyof Palette> = {
  cold: "tempCold",
  warm: "tempWarm",
  hot: "tempHot",
  burning: "tempBurning",
}

export function bucketGlow(c: Palette, bucket: Bucket) {
  return bucket === "burning"
    ? `0 0 0 3px ${c.tempHot}, 0 0 16px ${c.tempHot}`
    : `0 0 12px ${c[BUCKET_COLOR[bucket]]}`
}

export type BucketLabelProps = {
  bucket: Bucket
  label: string
  range?: string
  align?: "center" | "start"
}

// colour is always paired with the word
export const BucketLabel = ({ bucket, label, range, align = "center" }: BucketLabelProps) => {
  const { c } = useScheme()

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.stack, { alignItems: align === "center" ? "center" : "flex-start" }]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            { backgroundColor: c[BUCKET_COLOR[bucket]], boxShadow: bucketGlow(c, bucket) },
          ]}
        />
        <Text style={[type.title, { color: c.fg1 }]}>{label}</Text>
      </View>
      {range && <Text style={[type.mono, { color: c.fg2 }]}>{range}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: radius.full },
})
