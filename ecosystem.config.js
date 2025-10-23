module.exports = {
  apps: [{
    name: 'atenmed',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
