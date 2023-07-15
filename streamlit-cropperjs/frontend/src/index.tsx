import Cropper from "cropperjs";
import { RenderData, Streamlit } from "streamlit-component-lib";

// Add image div and btn div. Separately add img and button to respective div
// if we put them into same div, cropperjs will somehow generate the cropper tool
// that is zoomed in and to the right which is undesirable
const imageDiv = document.body.appendChild(document.createElement("div"))
const img = imageDiv.appendChild(document.createElement("img"))
const btnDiv = document.body.appendChild(document.createElement("div"))
const button = btnDiv.appendChild(document.createElement("button"))
// add cropperjs stylesheet. This is needed for cropperjs to work properly
const link = document.head.appendChild(document.createElement("link"))
link.rel = "stylesheet";
link.href = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css";

// Prepare our button with focus detection
button.textContent = "Detect!"
button.style.padding = "0.25rem 0.75rem"
button.style.backgroundColor = "white"
button.style.borderRadius = "0.5rem"
btnDiv.style.marginTop = "1rem"

let isFocused = false

button.onfocus = function(): void {
  isFocused = true
}

button.onblur = function(): void {
  isFocused = false
}

/**
 * The component's render function. This will be called immediately after
 * the component is initially loaded, and then again every time the
 * component gets new data from Python.
 */
function onRender(event: Event): void {
  // Get the RenderData from the event
  const data = (event as CustomEvent<RenderData>).detail

  // Maintain compatibility with older versions of Streamlit that don't send
  // a theme object.
  if (data.theme) {
    // Use CSS vars to style our button border. Alternatively, the theme style
    // is defined in the data.theme object.
    const borderStyling = `1px solid var(${
      isFocused ? "--primary-color" : "gray"
    })`
    button.style.border = borderStyling
    button.style.outline = borderStyling
    button.style.color = `var(${isFocused ? "--primary-color" : "red"})`
  }

  // Disable our button if necessary.
  button.disabled = data.disabled

  // RenderData.args is the JSON dictionary of arguments sent from the
  // Python script.
  let pic = data.args["pic"]
  // convert the pic into uint8array
  let arrayBufferView = new Uint8Array(pic);
  // display the image
  img.src = URL.createObjectURL(
    new Blob([arrayBufferView], { type: 'image/png' } /* (1) */)
  );
  img.style.maxHeight = "100%"
  img.style.maxWidth = "100%"
  img.id = data.args["key"]

  
  // Cropper.js
  var cropper = new Cropper(img, {
    autoCropArea: 0.5,
    viewMode: 2,
    guides: false,
    rotatable: false,
    ready: function (){
      // We tell Streamlit to update our frameHeight after each render event, in
      // case it has changed. (This isn't strictly necessary for the example
      // because our height stays fixed, but this is a low-cost function, so
      // there's no harm in doing it redundantly.)
      // wait for image to load finish first before runnning setFrameHeight
      Streamlit.setFrameHeight()

      // Add event listener to our button.
      // Send image data back to streamlit once button clicked
      button.addEventListener('click', function() {
        var croppedImage = cropper.getCroppedCanvas().toDataURL("image/png");
        // Push croppedImage to streamlit backend
        Streamlit.setComponentValue(croppedImage)
      })
    },
  });
}

// Attach our `onRender` handler to Streamlit's render event.
Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)

// Tell Streamlit we're ready to start receiving data. We won't get our
// first RENDER_EVENT until we call this function.
Streamlit.setComponentReady()

// Finally, tell Streamlit to update our initial height. We omit the
// `height` parameter here to have it default to our scrollHeight.
Streamlit.setFrameHeight()
