// Force-reference Capacitor plugin @objc classes so the linker keeps them in
// the final App binary. Without this, SPM static-library plugin symbols
// (HealthPlugin etc.) get dead-stripped and Capacitor's runtime
// NSClassFromString lookup silently returns nil — the JS bridge call then
// hangs forever with no error visible to the WebView.
//
// Swift module name == SPM target name (not product name); HealthPlugin is
// the target inside `@capgo/capacitor-health`.
import HealthPlugin

public let isCapacitorApp = true

@inline(never)
public func _keepPluginsAlive() {
    _ = HealthPlugin.self
}
