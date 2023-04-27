var canvas = document.getElementById("renderCanvas");
canvas.style.cursor = "none";
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
//Made by TheNosiriN
// its not complete, it has some bugs, but its still useable

var firstPerson = false;

//animations
var skeleton = null;
var ak47 = null;

var idleAnim = null;
var walkAnim = null;
var runAnim = null;
var sprintAnim = null;
var jumpAnim = null;

//variables
var animationBlend = 0.005;
var mouseSensitivity = 0.01;
var cameraSpeed = 0.0075;
var walkSpeed = 0.001;
var runSpeed = 0.005;
var sprintSpeed = 0.008;
var jumpSpeed = 0.3;
var jumpHeight = 1;
var jumped = false;
var falled = false;
var gravity = new BABYLON.Vector3(0, -0.5, 0);

var lastUpdate = null;

//in-game changed variables
var speed = 0;
var vsp = 0;

var mouseX = 0, mouseY = 0;
var mouseMin = -35, mouseMax = 45;

var firerate = 1;



var createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -9.81, 0);

    scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0));
    
    
    scene.fogEnabled = true;
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
	scene.fogDensity = 0.01;
    scene.fogColor = new BABYLON.Color3(0.8, 0.9, 1.0);
    scene.clearColor = scene.fogColor;



    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3.Zero(), scene);
    camera.inputs.clear();
    camera.minZ = 0;



    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var hemLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	hemLight.intensity = 0.7;
	hemLight.specular = BABYLON.Color3.Black();
    hemLight.groundColor = scene.clearColor.scale(0.75);

    var dirLight = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
    dirLight.position = new BABYLON.Vector3(0, 130, 130);


    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator(3072, dirLight);
    shadowGenerator.usePercentageCloserFiltering = true;


    var helper = scene.createDefaultEnvironment({
        enableGroundShadow: true,
        enableGroundMirror: true,
        groundMirrorFallOffDistance: 0,
        groundSize: 150,
        skyboxSize: 150,
    });
    helper.setMainColor(scene.clearColor);
    helper.groundMaterial.diffuseTexture = null;
    helper.groundMaterial.alpha = 1;
    helper.groundMaterial.fogEnabled = true;


    var addShadows = function(mesh){
        mesh.receiveShadows = true;
        shadowGenerator.addShadowCaster(mesh);
    }

    var addToMirror = function(mesh){
        helper.groundMirrorRenderList.push(mesh);
    }
    










    //tps
    const dsm = new BABYLON.DeviceSourceManager(engine);
    var deltaTime = 0;




    //character nodes
    var main = new BABYLON.Mesh("parent", scene);
    var target = new BABYLON.TransformNode();
    var character = new BABYLON.Mesh("character", scene);




    //camera setups
    var thirdPersonCamera = {
        middle: {
            position: new BABYLON.Vector3(0, 1.35, -5),
            fov: 0.8,
            mouseMin: -5,
            mouseMax: 45
        },
        leftRun: {
            position: new BABYLON.Vector3(2, 3, -10),
            fov: 0.8,
            mouseMin: -35,
            mouseMax: 45
        },
        rightRun: {
            position: new BABYLON.Vector3(-0.7, 1.35, -4),
            fov: 0.8,
            mouseMin: -35,
            mouseMax: 45
        },
        far: {
            position: new BABYLON.Vector3(0, 1.5, -6),
            fov: 1.5,
            mouseMin: -5,
            mouseMax: 45
        }
    };

    function switchCamera(type){
        camera.position = type.position.divide(camera.parent.scaling);
        camera.fov = type.fov;
        mouseMin = type.mouseMin,
        mouseMax = type.mouseMax
    }





    var smallLight = new BABYLON.PointLight("boxLight", new BABYLON.Vector3.Zero(), scene);
    smallLight.diffuse = new BABYLON.Color3(0.3, 0.5, 0.8);
    smallLight.specular = smallLight.specular;
    smallLight.intensity = 1;
    smallLight.range = 5;



    



    //character
    engine.displayLoadingUI();
    var character = createPlayer(scene);
    main.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5);
    main.ellipsoidOffset = new BABYLON.Vector3(0, main.ellipsoid.y, 0);
    main.checkCollisions = true;
    smallLight.parent = main;
    character.parent = main;
    target.parent = main;
    camera.parent = target;
    switchCamera(thirdPersonCamera.leftRun);
    main.position = new BABYLON.Vector3(10,0,10);


    engine.hideLoadingUI();



    scene.registerBeforeRender(function()
    {
        deltaTime = engine.getDeltaTime();

        updateCamera();
        
        if (character != null){
            var keyboard = dsm.getDeviceSource(BABYLON.DeviceType.Keyboard);
            var mouse = dsm.getDeviceSource(BABYLON.DeviceType.Mouse);
            if (keyboard)
            {

                thirdPersonMovement(
                    keyboard.getInput(87), //W
                    keyboard.getInput(83), //S
                    keyboard.getInput(65), //A
                    keyboard.getInput(68), //D
                    keyboard.getInput(32), //Space
                    keyboard.getInput(16), //Shift
                );
                shootASeed(
                    keyboard.getInput(70), //F
                    character
                );
                
            }
        }
    });



    
    var mouseMove = function(e)
    {
        var movementX = e.movementX ||
                e.mozMovementX ||
                e.webkitMovementX ||
                0;

        var movementY = e.movementY ||
                e.mozMovementY ||
                e.webkitMovementY ||
                0;
        
        mouseX += movementX * mouseSensitivity * deltaTime;
        mouseY += movementY * mouseSensitivity * deltaTime;
        mouseY = clamp(mouseY, mouseMin, mouseMax);
    }
    



    function updateCamera()
    {
        target.rotation = lerp3(
            target.rotation, 
            new BABYLON.Vector3(
                BABYLON.Tools.ToRadians(mouseY),
                BABYLON.Tools.ToRadians(mouseX), 0
            ), cameraSpeed*deltaTime
        );
    }

    let firetime = Date.now();
    function shootASeed(fire, character) {
        let r = 100;
        if (fire && (Date.now() - firetime)/1000 > firerate) {
            fireAmmo(character.absolutePosition, new BABYLON.Vector3(r*Math.sin(character.rotation.y),0,r*Math.cos(character.rotation.y)));
            firetime = Date.now();
        }

    }

    function thirdPersonMovement(up, down, left, right, jump, run)
    {
        var directionZ = up-down;
        var directionX = right-left;

        var vectorMove = new BABYLON.Vector3.Zero();
        var direction = Math.atan2(directionX, directionZ);
        
        //move
        if (directionX != 0 || directionZ != 0)
        {
            if (run != 1)
            {
                speed = lerp(speed, runSpeed, 1);   //
            }else{
                speed = lerp(speed, sprintSpeed, 2);    //
            }

            var rotation = (target.rotation.y+direction) % 360;
            character.rotation.y = lerp(
                character.rotation.y, rotation, 0.25
            );
            
            vectorMove = new BABYLON.Vector3(
                (Math.sin(rotation)), 0,
                (Math.cos(rotation))
            );
        }else{
            speed = lerp(speed, 0, 0.001);
        }

        


        //gravity
        if (jumped ) {
            vsp = jumpSpeed + scene.gravity.y* ((Date.now() - lastUpdate)/10000)
            console.log((Date.now() - lastUpdate) / 1000);
            if (_isGrounded(character)) {
                jumped = false;
                lastUpdate = Date.now();
                vsp = 0;
            }
            /*if (!jumped) {
                vsp += gravity.y* ((Date.now() - lastUpdate)/10000);
                vsp = Math.min(vsp, gravity.y);
            }*/
        }
        if (!_isGrounded(character) && !jumped && !falled) {
            falled = true;
            lastUpdate = Date.now();
        }
        if (falled) {
            vsp = scene.gravity.y * ((Date.now() - lastUpdate) / 10000);
            if (_isGrounded(character)) {
                falled = false;
                lastUpdate = Date.now();
                vsp = 0;
            }
        }
                //jump use _floorRaycast & _isGrounded
        if (jump == 1 && _isGrounded(character) && !jumped)
        {
            vsp = jumpSpeed;
            lastUpdate = Date.now();
            jumped = true;
        }
            

        var m = vectorMove.multiply(new BABYLON.Vector3().setAll( speed*deltaTime ));
        main.moveWithCollisions( m.add(new BABYLON.Vector3(0, vsp, 0)) );
    }

    function _floorRaycast(offsetx, offsetz, raycastlen,mesh) {
        //position the raycast from bottom center of mesh
        let raycastFloorPos = new BABYLON.Vector3(mesh.absolutePosition.x + offsetx, mesh.absolutePosition.y + -1.5, mesh.absolutePosition.z + offsetz);
        let ray = new BABYLON.Ray(raycastFloorPos, BABYLON.Vector3.Down(), raycastlen);
        //BABYLON.RayHelper.CreateAndShow(ray, scene, BABYLON.Color3.Red()); //visualize raycast

        //defined which type of meshes should be pickable
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }

        let pick = scene.pickWithRay(ray, predicate);

        if (pick.hit) { //grounded
            return pick.pickedPoint;
        } else { //not grounded
            return BABYLON.Vector3.Zero();
        }
    }
        //raycast from the center of the player to check for whether player is grounded
    function _isGrounded(character){
        if (_floorRaycast(0, 0, .1,character).equals(BABYLON.Vector3.Zero())) {
            return false;
        } else {
            return true;
        }
    }



    //tools
    function clamp(value, min, max)
    {
        return (Math.max(Math.min(value, max), min));
    }

    function lerp(start, end, speed)
    {
        return (start + ((end - start) * speed));
    }

    function lerp3(p1, p2, t)
    {
            var x = lerp(p1.x, p2.x, t);
            var y = lerp(p1.y, p2.y, t);
            var z = lerp(p1.z, p2.z, t);

            return new BABYLON.Vector3(x, y, z);
    }

    //mouse lock
    // Configure all the pointer lock stuff
    function setupPointerLock()
    {
        // register the callback when a pointerlock event occurs
        document.addEventListener('pointerlockchange', changeCallback, false);
        document.addEventListener('mozpointerlockchange', changeCallback, false);
        document.addEventListener('webkitpointerlockchange', changeCallback, false);

        // when element is clicked, we're going to request a
        // pointerlock
        canvas.onclick = function(){
            canvas.requestPointerLock = 
                canvas.requestPointerLock ||
                canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock
            ;

            // Ask the browser to lock the pointer)
            canvas.requestPointerLock();
        };

    }


    // called when the pointer lock has changed. Here we check whether the
    // pointerlock was initiated on the element we want.
    function changeCallback(e)
    {
        if (document.pointerLockElement === canvas ||
            document.mozPointerLockElement === canvas ||
            document.webkitPointerLockElement === canvas
        ){
            // we've got a pointerlock for our element, add a mouselistener
            document.addEventListener("mousemove", mouseMove, false);
        } else {
            // pointer lock is no longer active, remove the callback
            document.removeEventListener("mousemove", mouseMove, false);
        }
    };

    setupPointerLock();
    scene.detachControl();
    //scenery
    var box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
    box.position = new BABYLON.Vector3(8, 1, 8);
    addToMirror(box);
    addShadows(box);
    box.material = new BABYLON.StandardMaterial("lightBox", scene);
    box.material.emissiveColor = smallLight.diffuse;

    var boxLight = smallLight.clone();
    boxLight.parent = box;

/*
        addToMirror(tower);
        addShadows(tower);
        tower.checkCollisions = true;
*/
    
    helper.ground.checkCollisions = true;
    helper.skybox.checkCollisions = true;
    box.checkCollisions = true;

    //genereteLvl(createLvl);

    return scene;
};

var deleteObjAfterDelay = function (obj, delay) { 
    setTimeout(function () {
        obj.dispose();
    }, delay);
}

var fireAmmo = function (position, direction) {
    var ammo = new BABYLON.MeshBuilder.CreateCylinder("ammo", { diameter: 0.5, height: 0.5 }, scene);
    ammo.position = position;
    var ammoCoolider = new BABYLON.MeshBuilder.CreateBox("ammocollider", { size: 1 }, scene);
    ammoCoolider.isVisible = false;
    ammo.addChild(ammoCoolider);
    ammo.physicsImpostor = new BABYLON.PhysicsImpostor(ammo, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 }, scene);
    //ammoCoolider.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0)); // ?
    //ammoCoolider.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0)); // ?
    //throw ammo;
    ammo.physicsImpostor.applyImpulse(direction, position)
    deleteObjAfterDelay(ammo, 1000);
}
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
var genereteLvl = function (level,scene) {
    var buildingMaterial = new BABYLON.StandardMaterial("buildingMateriallvl", scene);
    var root = new BABYLON.Mesh("root", scene);
    for (var i = 0; i < level.length; i++) {
        for (var j = 0; j < level[i].length; j++) {
            if (level[i][j] == "X") {
                
            }
            if (level[i][j] == "B") {
                var build = BABYLON.Mesh.CreateBox("lvl", 1, scene);
                root.addChild(build);
                build.layerMask = 36;
                build.scaling.y = 0.1
                build.position.x = - level[i].length/2 + j;
                build.position.y = level.length - i -1;
                build.position.z = 0;
                build.checkCollisions = true;
                build.isPickable = true;
                build.material = buildingMaterial;
                buildingMaterial.diffuseColor = new BABYLON.Color3(1, 0.1, 0.1);
                buildingMaterial.diffuseColor = new BABYLON.Color3(1, 0.1, 0.1);
                //build.physicsImpostor =  new BABYLON.PhysicsImpostor(build, BABYLON.PhysicsImpostor.CubeImpostor, { mass: 0}, scene);

            }
        }
    }
    return root;
}

var createPlayer = function (scene) {
    var outer = BABYLON.MeshBuilder.CreateBox("outer", {size:3}, scene);
    outer.isVisible = false;
    outer.position.y = 1.5;
    outer.isPickable = false;
    //black cube to signify front of mesh
    var box = BABYLON.MeshBuilder.CreateBox("Small1", { width: 0.5, depth: 0.5, height: 0.25, faceColors: [0,0,0,0,0,0] }, scene);
    box.position.y = 1.5;
    box.position.z = 1;
    //body mesh of player
    var body = BABYLON.Mesh.CreateCylinder("body", 3, 2,2,0,0,scene);
    var bodymtl = new BABYLON.StandardMaterial("red",scene);
    bodymtl.diffuseColor = new BABYLON.Color3(.8,.5,.5);
    body.material = bodymtl;
    body.isPickable = false;
    box.parent = body;
    body.parent = outer;
    return outer;
}

var createGui = function (scene) {
    var button = document.createElement("button");
    button.style.top = "100px";
    button.style.right = "30px";
    button.setAttribute = ("id", "but");
    button.style.position = "absolute";
    button.style.color = "black";
    document.body.appendChild(button);
    return button;
}

var createBackgroundFullOfBuildings = function (deep,color,scene) {

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
