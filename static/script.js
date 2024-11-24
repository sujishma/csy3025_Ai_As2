document.addEventListener("DOMContentLoaded", function () {
    // Start Live Camera Feed
    const videoElement = document.getElementById("liveVideo");
    const constraints = { video: true };

    // Access the user's webcam
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
            videoElement.srcObject = stream;
        })
        .catch((error) => {
            console.error("Error accessing webcam:", error);
            alert("Unable to access the webcam. Please check your permissions.");
        });

    // Function Uploading Image
    function uploadImage() {
        const fileInput = document.getElementById("imageUpload");
        const file = fileInput.files[0];

        if (!file) {
            alert("Please upload an image!");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        fetch("/predict-image", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    alert(`Error: ${data.error}`);
                } else {
                    document.getElementById("result").innerText =
                        `Predicted Emotion: ${data.emotion}`;
                }
            })
            .catch((error) => console.error("Error:", error));
    }

    // Capturing a Frame 
    function captureAndPredict() {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // Set canvas dimensions to match the video
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        // Draw the current frame from the video onto the canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to an image (Blob)
        canvas.toBlob((blob) => {
            const formData = new FormData();
            formData.append("file", blob, "captured_frame.jpg");

            fetch("/predict-image", {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        alert(`Error: ${data.error}`);
                    } else {
                        document.getElementById("liveResult").innerText =
                            `Predicted Emotion: ${data.emotion}`;
                    }
                })
                .catch((error) => console.error("Error:", error));
        });
    }

    // Continuous Live Predictions
    function startLivePrediction() {
        const canvasElement = document.createElement("canvas");
        const context = canvasElement.getContext("2d");

        setInterval(() => {
            
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    
            canvasElement.toBlob((blob) => {
                const formData = new FormData();
                formData.append("file", blob, "frame.jpg");

                fetch("/predict-image", {
                    method: "POST",
                    body: formData,
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.error) {
                            console.error("Error:", data.error);
                        } else {
                            document.getElementById("liveResult").innerText =
                                `Predicted Emotion: ${data.emotion}`;
                        }
                    })
                    .catch((error) => console.error("Error:", error));
            });
        }, 1000); 
    }

    // Attach Event Listeners to Buttons
    document.getElementById("uploadImageBtn").addEventListener("click", uploadImage);
    document.getElementById("capturePredictBtn").addEventListener("click", captureAndPredict);

    //  prediction loop
    startLivePrediction();
});
