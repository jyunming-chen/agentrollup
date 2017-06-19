import { Vector3 } from "../../node_modules/three/build/three.module.js";
import { Mesh } from "../../node_modules/three/build/three.module.js";

//import * from " ./constants.js ";
var MAXSPEED = 25;
var MAXFORCE = 25;
var REACH = 50;
var ARRIVAL_R = 30;

// constructor
export function SceneSystem (scene) {
	this.obstacles = [];
	this.agents = [];
	this.scene = scene;  // allocated in init()
	
	this.addObstacle = function (center, size) {
		var ob = new Obstacle(center, size);
		this.obstacles.push (ob);
		this.scene.add (ob.mesh);
	};
	
	this.addAgent = function (pos, vel) {
		var ag = new Agent (pos, vel, this);
		this.scene.add (ag.mesh);
		this.agents.push (ag);
	};
	
	this.update = function (dt) {
		this.agents.forEach (function (agent) {
			agent.step(dt);
			agent.mesh.position.copy (agent.pos);
		});
	};
	
	this.setTarget = function (target) {
		this.agents.forEach (function (agent) {
			agent.target.copy (target);
			
		});
	}
}

var Obstacle = function (center,size) {
	this.center = center.clone();  
	this.mesh = new THREE.Mesh (new THREE.CylinderGeometry(size,size,1,20),
			new THREE.MeshBasicMaterial());
	this.mesh.position.copy (center);
	this.size = size;
};

export function Agent (pos, vel, sys) {
	this.pos = pos || new THREE.Vector3();
	this.vel = vel || new THREE.Vector3();
	this.sys = sys;
	this.force = new THREE.Vector3();
	
	this.target = new THREE.Vector3(0,0,0);  // singularity problem ...
	
	this.size = 3;  // physical size of the character
	this.mesh = new THREE.Mesh (new THREE.CylinderGeometry(3,3,1,20),
			new THREE.MeshBasicMaterial({color:0xff0000}));
};

Agent.prototype = {
  render: function() {
  },
  
  step: function (dt) {
  
	this.accumForce();
		
	// vel += force*dt
	this.vel.add ( this.force.clone().multiplyScalar(dt) );  

	// velocity modulation by arriving
	var diff = new THREE.Vector3();
	diff.subVectors (this.target, this.pos);
	var dst = diff.length();
	if (dst < ARRIVAL_R) {
	  if (dst === 0.0) 
		this.vel.set (0,0,0);	  // setLength has length at denominator
		                          // become NaN when dst is ZERO
		                          // (target coincide with pos)
	  else
	  	this.vel.setLength (dst);	
	}
	
	// pos += vel*dt
	this.pos.add ( this.vel.clone().multiplyScalar (dt) ); 

  },

  accumForce:  function () {
  
	// clear force accumulator
	this.force.set (0,0,0);
	
	if (this.target.equals (this.pos))
		return;
		
	var sum = new THREE.Vector3(0,0,0);
	
	// seek
	var tmp = new THREE.Vector3();
	
	tmp.subVectors (this.target, this.pos);
	tmp.normalize().multiplyScalar (MAXSPEED);
	sum.subVectors (tmp, this.vel);
	
	// collision
	var vhat = this.vel.clone().normalize();
	
	for (var i = 0; i < this.sys.obstacles.length; i++) {
	  // many obstacles, pick the most threatening one
	  var ob = this.sys.obstacles[i];
	  tmp.subVectors (ob.center, this.pos); // c-p
	  var tll = tmp.dot(vhat);

	  if (tll > 0 && tll < REACH) {
		vhat.multiplyScalar (tll);
		var tperp = new THREE.Vector3();
		tperp.subVectors (tmp, vhat);
		if (tperp.length() < ob.size+this.size) {
			tperp.negate();
			sum.add (tperp);
			console.log ("hit", tperp);
		}
	  }
	}
/*	
	if (isNaN(tmp.x))
	  this.force.set (0,0,0);
	else
	  this.force.copy (sum);
*/
	this.force.copy (sum);

  },
}

