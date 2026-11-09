# ASRTAVA PACS Web DICOM Viewer Validation

## 1. Overview
The ASRTAVA diagnostic web viewer provides zero-footprint, browser-based DICOM visualization for radiologists, clinicians, and emergency doctors.

## 2. Capabilities Validated
1. **Window / Level Presets (Hounsfield Units - HU)**:
   - Lung Window: Window Width 1500 / Window Level -600
   - Bone Window: Window Width 2000 / Window Level 350
   - Soft Tissue / Mediastinum: Window Width 350 / Window Level 40
   - Brain: Window Width 80 / Window Level 40
   - Stroke Window: Window Width 40 / Window Level 40
2. **Multi-Planar Reconstruction (MPR)**:
   - Axial, Sagittal, and Coronal dynamic orthogonal slicing.
3. **Measurement & Annotation**:
   - Calibrated distance measurement (mm), angle measurement, region of interest (ROI) mean HU calculation.
4. **Bandwidth Optimization**:
   - Progressive streaming via DICOMweb (WADO-RS / QIDO-RS).
   - Lossless 16-bit grayscale rendering using HTML5 Canvas & WebGL hardware acceleration.

