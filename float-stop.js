#!/usr/bin/env osascript -l JavaScript
// 懸浮「停止錄影」按鈕（JXA + Cocoa）
// 用法: osascript float-stop.js <x> <yTop> <stopCmd>
//   x, yTop  — 面板左上角的螢幕座標（一般座標系，左上原點）
//   stopCmd  — 按下按鈕時要執行的 shell 指令
ObjC.import('Cocoa')

function run(argv) {
  var x = parseInt(argv[0], 10)
  var yTop = parseInt(argv[1], 10)
  var stopCmd = argv[2]
  var W = 150, H = 56

  // Cocoa 座標是左下原點，用主螢幕高度換算
  var scr = $.NSScreen.screens.objectAtIndex(0).frame
  var y = scr.size.height - yTop - H

  $.NSApplication.sharedApplication
  $.NSApp.setActivationPolicy(1) // Accessory: 不出現在 Dock

  // styleMask: 1=titled, 128=nonactivating panel（點了不搶走 Chrome 焦點）
  var panel = $.NSPanel.alloc.initWithContentRectStyleMaskBackingDefer(
    $.NSMakeRect(x, y, W, H), 1 | 128, 2, false)
  panel.title = '錄影中'
  panel.level = 25               // NSStatusWindowLevel: 蓋過一般視窗
  panel.collectionBehavior = 1   // 跟著所有桌面 Space
  panel.hidesOnDeactivate = false

  ObjC.registerSubclass({
    name: 'StopHandler',
    superclass: 'NSObject',
    methods: {
      'clicked:': {
        types: ['void', ['id']],
        implementation: function (sender) {
          $.NSTask.launchedTaskWithLaunchPathArguments('/bin/bash', $(['-c', stopCmd]))
          $.NSApp.terminate(null)
        }
      }
    }
  })
  var handler = $.StopHandler.alloc.init

  var btn = $.NSButton.alloc.initWithFrame($.NSMakeRect(10, 8, W - 20, 40))
  btn.title = '⏹ 停止錄影'
  btn.bezelStyle = 1
  btn.target = handler
  btn.action = 'clicked:'
  panel.contentView.addSubview(btn)

  panel.orderFrontRegardless
  $.NSApp.run
}
