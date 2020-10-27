export default function dragAndResize(panel, resizeBar, panelLeft, panelRight) {
  resizeBar.onmousedown = function(e) {
    const startX = e.clientX
    resizeBar.left = resizeBar.offsetLeft
    document.onmousemove = function(e) {
      const endX = e.clientX

      let moveLen = resizeBar.left + (endX - startX)
      const maxT = panel.clientWidth - resizeBar.offsetWidth
      if (moveLen < 0) moveLen = 0
      if (moveLen > maxT) moveLen = maxT

      resizeBar.style.left = moveLen
      panelLeft.style.width = moveLen + 'px'
      panelRight.style.width = (panel.clientWidth - moveLen - 4) + 'px'
    }
    document.onmouseup = function() {
      document.onmousemove = null
      document.onmouseup = null
      resizeBar.releaseCapture && resizeBar.releaseCapture()
    }
    resizeBar.setCapture && resizeBar.setCapture()
    return false
  }
}
