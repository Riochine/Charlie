var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function(engine, canvas) {
    engine.runRenderLoop(function() {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function() {
    return new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false
    });
};
var createScene = function() {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    // a camera to view the scene in 2D with front view
    var camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 2, -10), scene);
    //var player = new BABYLON.MeshBuilder.CreateBox("player", {}, scene);


    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 1;


    //background
    for(var i = 100 ; i > 2 ; i-=10)
        createBackgroundFullOfBuildings(i,new BABYLON.Color3((100-i)/100,(100-i)/100,(100-i)/100));
    //lvl
    genereteLvl(createLvl());

        /*
    BABYLON.SceneLoader.ImportMesh("", Assets.meshes.Yeti.rootUrl, Assets.meshes.Yeti.filename, scene, function(newMeshes) {
        newMeshes[0].scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
    });
*/

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 6,
        height: 6
    }, scene);
    let groundMaterial = new BABYLON.StandardMaterial("Ground Material", scene);
    ground.material = groundMaterial;
    /*let groundTexture = new BABYLON.Texture(Assets.textures.checkerboard_basecolor_png.rootUrl, scene);
    ground.material.diffuseTexture = groundTexture;*/

    return scene;
};

//genere un niveau 2D a la super mario
var createLvl = function () {
    var level = [
        "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXBXXXXXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXXBBXXXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXXXXXXBXXXXXXXXXXXXXXXXXXXXXXX",
        "XXXXXXXXXXBBBBBXXXXXXXXXBBBBXXXXXXXXXXX",
        "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
    ];
    return level;
}
var genereteLvl = function (level) {
    var buildingMaterial = new BABYLON.StandardMaterial("buildingMateriallvl", scene);
    for (var i = 0; i < level.length; i++) {
        for (var j = 0; j < level[i].length; j++) {
            if (level[i][j] == "X") {
                
            }
            if (level[i][j] == "B") {
                var build = BABYLON.Mesh.CreateBox("lvl", 1, scene);
                build.scaling.y = 0.1
                build.position.x = - level[i].length/2 + j;
                build.position.y = level.length - i -1;
                build.position.z = 0;
                build.checkCollisions = true;
                build.material = buildingMaterial;
                buildingMaterial.diffuseColor = new BABYLON.Color3(1, 0.1, 0.1);
                buildingMaterial.diffuseColor = new BABYLON.Color3(1, 0.1, 0.1);
            }
        }
    }
}


var createBackgroundFullOfBuildings = function (deep,color) {

    //Create a grid of buildings.
    var buildingSizeMin = 8;
    var buildingSizeMax = 10;
    var buildingWidthMin = 2;
    var buildingWidthMax = 4;

    for (var x = -25 * (deep/10); x < 25 * (deep/10); x+=buildingSize) {
        var buildingSize = Math.floor(Math.random() * buildingSizeMax - buildingSizeMin +1) + buildingSizeMin;
        var building = BABYLON.Mesh.CreateBox("building", 1, scene);
        var buildingMaterial = new BABYLON.StandardMaterial("buildingMaterial", scene);
        building.scaling.x = Math.floor(Math.random() * buildingWidthMax - buildingWidthMin + 1) + buildingWidthMin;
        building.scaling.y = buildingSize;
        building.material = buildingMaterial;
        building.position.z = deep;
        building.position.x = (x * buildingSize);
        building.position.y = buildingSize/2;
        building.checkCollisions = true;
        buildingMaterial.diffuseColor = color;
        buildingMaterial.specularColor = color;
    }
};
        

window.initFunction = async function() {


    var asyncEngineCreation = async function() {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }

    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    startRenderLoop(engine, canvas);
    window.scene = createScene();
};
initFunction().then(() => {
    sceneToRender = scene
});

// Resize
window.addEventListener("resize", function() {
    engine.resize();
});
