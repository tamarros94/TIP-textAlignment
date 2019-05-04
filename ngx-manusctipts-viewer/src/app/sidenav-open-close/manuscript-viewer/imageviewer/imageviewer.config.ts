export class ImageViewerConfig {
  width?: number;
  height?: number;
  bgStyle?: string;
  scaleStep?: number;
  rotateStepper?: boolean;
  buttonStyle?: ButtonStyle;
  loadingMessage?: string;
  tooltips?: {
    enabled?: boolean,
    bgStyle?: string,
    bgAlpha?: number,
    textStyle?: string,
    textAlpha?: number,
    padding?: number,
    radius?: number
  };
  zoomOutButton?: ButtonConfig;
  zoomInButton?: ButtonConfig;
  rotateLeftButton?: ButtonConfig;
  rotateRightButton?: ButtonConfig;
  resetButton?: ButtonConfig;
  addNotationButton?: ButtonConfig;
  addPolygonButton?: ButtonConfig;
  addPolylineButton?: ButtonConfig;
  deleteButton?: ButtonConfig;
  saveChangesButton?: ButtonConfig;
}

export interface ButtonStyle {
  iconFontFamily?: string;
  alpha?: number;
  hoverAlpha?: number;
  pressedColor?: string;
  bgStyle?: string;
  iconStyle?: string;
  borderStyle?: string;
  borderWidth?: number;
}

export interface ButtonConfig {
  icon?: string;
  tooltip?: string;
  sortId?: number;
  show?: boolean;
}

export function createButtonConfig(icon?: string, tooltip?: string, sortId: number = 0, show: boolean = true) {
  return { icon: icon, tooltip: tooltip, sortId: sortId, show: show };
}



export let IMAGEVIEWER_CONFIG: ImageViewerConfig = {
  width: 800, // component default width
  height: 600, // component default height
  bgStyle: '#ECEFF1', // component background style
  scaleStep: 0.1, // zoom scale step (using the zoom in/out buttons)
  rotateStepper: true,
  loadingMessage: 'Loading...',
  buttonStyle: {
    iconFontFamily: 'Material Icons', // font used to render the button icons
    alpha: 0.5, // buttons' transparence value
    hoverAlpha: 0.7, // buttons' transparence value when mouse is over
    pressedColor: '#2c10cc', // buttons' presses mode color
    bgStyle: '#000000', //  buttons' background style
    iconStyle: '#ffffff', // buttons' icon colors
    borderStyle: '#000000', // buttons' border style
    borderWidth: 0 // buttons' border width (0 == disabled)
  },
  tooltips: {
    enabled: true, // enable or disable tooltips for buttons
    bgStyle: '#000000', // tooltip background style
    bgAlpha: 0.5, // tooltip background transparence
    textStyle: '#ffffff', // tooltip's text style
    textAlpha: 0.9, // tooltip's text transparence
    padding: 5, // tooltip padding
    radius: 16 // tooltip border radius
  },
  zoomOutButton: createButtonConfig(String.fromCharCode(0xE900), 'Zoom out', 0),
  zoomInButton: createButtonConfig(String.fromCharCode(0xE8FF), 'Zoom in', 1),
  rotateLeftButton: createButtonConfig(String.fromCharCode(0xE419), 'Rotate left', 2),
  rotateRightButton: createButtonConfig(String.fromCharCode(0xE41A), 'Rotate right', 3),
  resetButton: createButtonConfig(String.fromCharCode(0xE863), 'Reset', 4),
  addNotationButton: createButtonConfig(String.fromCharCode(0xE24C), 'Add textbox note', 5),
  addPolygonButton: createButtonConfig(String.fromCharCode(0xE86b), 'Add polygon', 6),
  addPolylineButton: createButtonConfig(String.fromCharCode(0xE922), 'Add polyline', 7),
  deleteButton: createButtonConfig(String.fromCharCode(0xE872), 'Delete', 8),
  saveChangesButton: createButtonConfig(String.fromCharCode(0xE161), 'Save Changes', 9)
};
