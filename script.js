const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const mergeButton = document.getElementById('merge');
const animationContainer = document.getElementById('animation-container');
const animationDurationInput = document.getElementById('animation-duration');
const downloadButton = document.getElementById('download');

let svgFrames = [];

function showDownloadButton() {
    downloadButton.style.display = 'block';
}

function hideDownloadButton() {
    downloadButton.style.display = 'none';
}

downloadButton.addEventListener('click', () => {
    const svgData = new XMLSerializer().serializeToString(animationContainer.firstChild);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'animation.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
});

function handleFiles(files) {
    for (const file of files) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (file.type === 'image/svg+xml' && fileExtension === 'svg') {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                svgFrames.push(reader.result);
                updateFileCount();
                updateButtonText();
            };
        }
    }
}

function updateButtonText() {
    mergeButton.textContent = svgFrames.length > 1 ? 'Animate' : 'Upload Frames';
    mergeButton.classList.toggle('button--inactive', svgFrames.length <= 1);
}

function updateFileCount() {
    const fileCount = document.getElementById('file-count');
    fileCount.textContent = `${svgFrames.length} files uploaded`;
}

function dragHandler(event) {
    event.preventDefault();
    dropzone.classList.toggle("dropzone--active", event.type === "dragover" || event.type === "drop");

    if (event.type === "drop") {
        handleFiles(event.dataTransfer.files);
    }
}

dropzone.addEventListener('dragover', dragHandler);
dropzone.addEventListener('dragleave', dragHandler);
dropzone.addEventListener('drop', dragHandler);

fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = ''; // Clear the file input value
});

mergeButton.addEventListener('click', () => {
    if (svgFrames.length <= 1) {
        alert('At least 2 SVG files need to be added.');
        return;
    }

    const totalAnimationDuration = parseFloat(animationDurationInput.value);
    const frameDuration = totalAnimationDuration / svgFrames.length;

    const animation = createAnimationElement(svgFrames, frameDuration);
    animationContainer.innerHTML = '';
    animationContainer.appendChild(animation);

    // Show the download button after the animation is created
    showDownloadButton();

    // Reset the file list after the merging process is complete
    svgFrames = [];
    updateFileCount();
    updateButtonText();
});

function createAnimationElement(frames, frameDuration) {
  const animation = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  animation.setAttribute('width', '600');
  animation.setAttribute('height', '600');
  animation.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  animation.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  animation.appendChild(g);

  frames.forEach((frame, index) => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(frame, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      const frameGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      while (svgElement.childNodes.length > 0) {
          frameGroup.appendChild(svgElement.childNodes[0]);
      }

      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'display');
      animate.setAttribute('values', generateAnimateValues(frames.length, index));
      animate.setAttribute('dur', `${frames.length * frameDuration}s`);
      animate.setAttribute('repeatCount', 'indefinite');

      frameGroup.appendChild(animate);
      g.appendChild(frameGroup);
  });

  return animation;
}

function generateAnimateValues(frameCount, visibleFrame) {
  return Array.from({ length: frameCount }, (_, i) => (i === visibleFrame ? 'inline' : 'none')).join(';');
}