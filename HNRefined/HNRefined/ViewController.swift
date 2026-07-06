//
//  ViewController.swift
//  HNRefined
//
//  Created by Yuan Jiang on 2026/7/3.
//

import Cocoa
import SafariServices

private func extensionBundleIdentifier() -> String {
    guard let plugInsURL = Bundle.main.builtInPlugInsURL,
          let extensionURL = try? FileManager.default.contentsOfDirectory(
            at: plugInsURL,
            includingPropertiesForKeys: nil
          ).first(where: { $0.pathExtension == "appex" }),
          let extensionBundleIdentifier = Bundle(url: extensionURL)?.bundleIdentifier else {
        preconditionFailure("HNRefined Extension bundle identifier is unavailable.")
    }

    return extensionBundleIdentifier
}

class ViewController: NSViewController {

    private let statusLabel = NSTextField(labelWithString: "Checking HN Refined extension status...")
    private let openSettingsButton = NSButton(title: "Open Safari Settings...", target: nil, action: nil)

    override func viewDidLoad() {
        super.viewDidLoad()

        renderInstallStatus()
        refreshExtensionState()
    }

    private func renderInstallStatus() {
        view.subviews.removeAll()
        view.wantsLayer = true
        view.layer?.backgroundColor = NSColor.windowBackgroundColor.cgColor

        let iconView = NSImageView()
        iconView.image = Bundle.main.url(forResource: "Icon", withExtension: "png")
            .flatMap { NSImage(contentsOf: $0) }
        iconView.imageScaling = .scaleProportionallyUpOrDown
        iconView.translatesAutoresizingMaskIntoConstraints = false
        iconView.widthAnchor.constraint(equalToConstant: 96).isActive = true
        iconView.heightAnchor.constraint(equalToConstant: 96).isActive = true

        statusLabel.alignment = .center
        statusLabel.font = .preferredFont(forTextStyle: .body)
        statusLabel.lineBreakMode = .byWordWrapping
        statusLabel.maximumNumberOfLines = 0
        statusLabel.textColor = .labelColor

        openSettingsButton.target = self
        openSettingsButton.action = #selector(openSafariSettings)
        openSettingsButton.bezelStyle = .rounded

        let stackView = NSStackView(views: [iconView, statusLabel, openSettingsButton])
        stackView.orientation = .vertical
        stackView.alignment = .centerX
        stackView.spacing = 18
        stackView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(stackView)

        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stackView.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 32),
            stackView.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -32)
        ])
    }

    private func refreshExtensionState() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier()) { (state, error) in
            DispatchQueue.main.async {
                guard let state = state, error == nil else {
                    self.statusLabel.stringValue = "Open Safari Settings to enable HN Refined in Extensions."
                    return
                }

                self.statusLabel.stringValue = state.isEnabled
                    ? "HN Refined is currently enabled in Safari."
                    : "HN Refined is currently disabled. Enable it in Safari Settings."
            }
        }
    }

    @objc private func openSafariSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier()) { error in
            DispatchQueue.main.async {
                NSApplication.shared.terminate(nil)
            }
        }
    }

}
