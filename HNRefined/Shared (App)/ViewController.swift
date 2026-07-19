//
//  ViewController.swift
//  Shared (App)
//
//  Created by Yuan Jiang on 2026/7/7.
//

import WebKit
import SafariServices

#if os(iOS)
import UIKit
typealias PlatformViewController = UIViewController
#elseif os(macOS)
import Cocoa
typealias PlatformViewController = NSViewController
#endif

let extensionBundleIdentifier = "net.vetcafe.hnrefined.extension"

class ViewController: PlatformViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!
    private var webContentReady = false

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self

        self.webView.configuration.userContentController.add(self, name: "controller")

#if os(iOS)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applicationDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
#endif

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webContentReady = true

#if os(iOS)
        webView.evaluateJavaScript("show('ios')") { [weak self] _, _ in
            self?.refreshExtensionState()
        }
#elseif os(macOS)
        webView.evaluateJavaScript("show('mac')")

        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                if #available(macOS 13, *) {
                    webView.evaluateJavaScript("show('mac', \(state.isEnabled), true)")
                } else {
                    webView.evaluateJavaScript("show('mac', \(state.isEnabled), false)")
                }
            }
        }
#endif
    }

#if os(iOS)
    @objc private func applicationDidBecomeActive() {
        refreshExtensionState()
    }

    private func refreshExtensionState() {
        guard webContentReady else { return }

        if #available(iOS 26.2, *) {
            SFSafariExtensionManager.getStateOfExtension(withIdentifier: extensionBundleIdentifier) { [weak self] state, error in
                guard let self, let state, error == nil else { return }

                DispatchQueue.main.async {
                    self.webView.evaluateJavaScript("show('ios', \(state.isEnabled))")
                }
            }
        }
    }
#endif

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
#if os(macOS)
        if (message.body as! String != "open-preferences") {
            return
        }

        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            guard error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                NSApp.terminate(self)
            }
        }
#endif
    }

}
