/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 CuteZam
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import definePlugin from "@utils/types";

export default definePlugin({
  name: "StreamZoom",
  description: "Middle-click + drag to move, and Ctrl + wheel to zoom.",
  authors: [{ name: "CuteZam", id: 0n }],

  start() {
    // state
    this.eventListenersAdded = false;
    this.videoFrame = null;

    // find the stream video element and wire up events
    this.checkForVideoFrame = () => {
      const el = document.querySelector<HTMLElement>('[class*="videoFrame_"]');
      if (el && !this.eventListenersAdded) {
        // initialize position & scale
        el.style.transform = "scale(1)";
        el.style.left = "1px";
        el.style.top = "-60px";

        // attach handlers
        el.addEventListener("mousedown", this.handleMouseDown);
        el.addEventListener("wheel", this.handleMouseWheel);

        this.eventListenersAdded = true;
        this.videoFrame = el;
      } else if (!el && this.eventListenersAdded) {
        this.removeEventListeners();
      }
    };

    // remove existing listeners
    this.removeEventListeners = () => {
      if (this.videoFrame) {
        this.videoFrame.removeEventListener("mousedown", this.handleMouseDown);
        this.videoFrame.removeEventListener("wheel", this.handleMouseWheel);
      }
      this.eventListenersAdded = false;
      this.videoFrame = null;
    };

    // pan on middle-click
    this.handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 1 || !this.videoFrame) return;
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      const rect = this.videoFrame.getBoundingClientRect();
      const baseLeft = parseInt(this.videoFrame.style.left) || rect.left;
      const baseTop  = parseInt(this.videoFrame.style.top)  || rect.top;

      const onMove = (m: MouseEvent) => {
        this.videoFrame!.style.left = baseLeft + (m.clientX - startX) + "px";
        this.videoFrame!.style.top  = baseTop  + (m.clientY - startY) + "px";
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    // zoom on Ctrl + wheel
    this.handleMouseWheel = (e: WheelEvent) => {
      if (!e.ctrlKey || !this.videoFrame) return;
      e.preventDefault();
      const amount = 0.05;
      const curr = Number(this.videoFrame.style.transform.replace(/[^0-9.]/g, "")) || 1;
      const delta = e.deltaY < 0 ? amount : -amount;
      const next  = Math.max(0.1, curr + delta);

      const rect = this.videoFrame.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const shiftX = ((x - rect.width/2) * delta) / next;
      const shiftY = ((y - rect.height/2) * delta) / next;

      this.videoFrame.style.transform = `scale(${next})`;
      this.videoFrame.style.left = `${(parseFloat(this.videoFrame.style.left)||0) - shiftX}px`;
      this.videoFrame.style.top  = `${(parseFloat(this.videoFrame.style.top)||0)  - shiftY}px`;
    };

    // poll for stream windows every second
    this.updateInterval = window.setInterval(this.checkForVideoFrame, 1000);
  },

  stop() {
    clearInterval(this.updateInterval);
    this.removeEventListeners();
  },
});
