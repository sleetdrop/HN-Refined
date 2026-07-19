//
//  AppDelegate.swift
//  macOS (App)
//
//  Created by Yuan Jiang on 2026/7/7.
//

import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationDidFinishLaunching(_ notification: Notification) {
        if let iconPath = Bundle.main.path(forResource: "AppIcon", ofType: "icns"),
           let icon = NSImage(contentsOfFile: iconPath) {
            NSApp.applicationIconImage = icon
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

}
