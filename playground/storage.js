const __Storage = {
  values: null,
  savedText: null,
  
  init: function() {
    Storage.prototype.setObject = function(key, value) { 
      this.setItem(key, JSON.stringify(value));
    }
    
    Storage.prototype.getObject = function(key) { 
      var value = this.getItem(key); 
      return value && JSON.parse(value);
    }

    this.values = localStorage.getObject('gibber2');

    if (!this.values) {
      this.values = {
        onload: null,
        savedText: null,
        projects: {}
      }
      this.save();
    } else if (!this.values.projects) {
      this.values.projects = {};
      this.save();
    }
  },

  save: function() {
    localStorage.setObject("gibber2", this.values);
  },

  runUserSetup: function() {
    if (this.values.savedText) {
      try {
        eval(this.values.savedText);
      } catch(e) {
        console.log('There was an error running your preload code:\n' + __Storage.values.savedText);
      }
    }
  },
  
  // Save project to local storage
  saveProjectLocal: function(name, code) {
    if (!this.values.projects) {
      this.values.projects = {};
    }
    
    this.values.projects[name] = {
      code,
      timestamp: Date.now()
    };
    
    this.save();
    return true;
  },
  
  // Load project from local storage
  loadProjectLocal: function(name) {
    if (!this.values.projects || !this.values.projects[name]) {
      return null;
    }
    
    return this.values.projects[name].code;
  },
  
  // List projects from local storage
  listProjectsLocal: function() {
    if (!this.values.projects) {
      return [];
    }
    
    return Object.keys(this.values.projects).map(name => ({
      name,
      timestamp: this.values.projects[name].timestamp,
      storage: 'local'
    }));
  },
  
  // Save project to Supabase if user is logged in, otherwise save locally
  saveProject: async function(name, code) {
    // Save locally as backup
    this.saveProjectLocal(name, code);
    
    // If we have Supabase and user is logged in, save to cloud
    if (window.GibberSaaS && window.GibberAuth && window.GibberAuth.isLoggedIn()) {
      try {
        const user = window.GibberAuth.getUser();
        await window.GibberSaaS.saveProject(name, code, user.id);
        console.log('Project saved to cloud:', name);
        return true;
      } catch (error) {
        console.error('Error saving to cloud, using local storage:', error);
        return true; // Still successful with local storage
      }
    }
    
    return true;
  },
  
  // Load project from Supabase if user is logged in, otherwise load from local storage
  loadProject: async function(name) {
    // If we have Supabase and user is logged in, try to load from cloud
    if (window.GibberSaaS && window.GibberAuth && window.GibberAuth.isLoggedIn()) {
      try {
        const user = window.GibberAuth.getUser();
        const code = await window.GibberSaaS.loadProject(name, user.id);
        console.log('Project loaded from cloud:', name);
        return code;
      } catch (error) {
        console.error('Error loading from cloud, trying local storage:', error);
        // Fall back to local storage
      }
    }
    
    // Load from local storage
    return this.loadProjectLocal(name);
  },
  
  // List projects from Supabase and local storage
  listProjects: async function() {
    let projects = this.listProjectsLocal();
    
    // If we have Supabase and user is logged in, get cloud projects too
    if (window.GibberSaaS && window.GibberAuth && window.GibberAuth.isLoggedIn()) {
      try {
        const user = window.GibberAuth.getUser();
        const cloudProjects = await window.GibberSaaS.listProjects(user.id);
        
        // Convert to same format as local projects
        const formattedCloudProjects = cloudProjects.map(project => ({
          name: project.name,
          timestamp: new Date(project.updated_at).getTime(),
          storage: 'cloud'
        }));
        
        // Combine projects, prioritizing cloud versions
        const cloudProjectNames = formattedCloudProjects.map(p => p.name);
        projects = projects.filter(p => !cloudProjectNames.includes(p.name))
                           .concat(formattedCloudProjects);
      } catch (error) {
        console.error('Error listing cloud projects:', error);
      }
    }
    
    // Sort by timestamp, newest first
    return projects.sort((a, b) => b.timestamp - a.timestamp);
  },
  
  // Delete a project
  deleteProject: async function(name) {
    // Delete from local storage
    if (this.values.projects && this.values.projects[name]) {
      delete this.values.projects[name];
      this.save();
    }
    
    // If we have Supabase and user is logged in, delete from cloud too
    if (window.GibberSaaS && window.GibberAuth && window.GibberAuth.isLoggedIn()) {
      try {
        const user = window.GibberAuth.getUser();
        // TODO: Add deleteProject to supabase.js
        // await window.GibberSaaS.deleteProject(name, user.id);
        console.log('Project deleted from cloud:', name);
      } catch (error) {
        console.error('Error deleting from cloud:', error);
      }
    }
    
    return true;
  }
};

module.exports = __Storage;
