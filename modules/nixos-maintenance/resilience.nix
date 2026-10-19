{pkgs, ...}: {
  # Load zram kernel module and ensure kmod tools are available
  boot.kernelModules = ["zram"];
  environment.systemPackages = with pkgs; [kmod];

  # Declarative in-memory compressed RAM swap for WSL 2 (zero host disk I/O, prevents VHDX ballooning)
  # Uses native WSL 2 kernel lzo-rle compression and high-priority (100) memory paging
  systemd.services.zram-wsl-swap = {
    description = "WSL 2 In-Memory Compressed zram Swap Setup";
    wantedBy = ["multi-user.target"];
    after = ["systemd-modules-load.service"];
    path = with pkgs; [kmod util-linux gawk coreutils];
    script = ''
      if ! swapon --show | grep -q "/dev/zram0"; then
        modprobe zram 2>/dev/null || true
        total_ram=$(awk '/MemTotal/ {print $2 * 1024}' /proc/meminfo)
        zram_size=$((total_ram / 2))

        if [ -b /dev/zram0 ]; then
          echo 1 > /sys/block/zram0/reset 2>/dev/null || true
          echo lzo-rle > /sys/block/zram0/comp_algorithm 2>/dev/null || true
          echo "$zram_size" > /sys/block/zram0/disksize
          mkswap /dev/zram0
          swapon -p 100 /dev/zram0
        fi
      fi
    '';
    serviceConfig = {
      Type = "oneshot";
      RemainAfterExit = true;
    };
  };

  # Pressure Stall Information (PSI) memory sentinel to prevent system freezes
  systemd.oomd = {
    enable = true;
    enableRootSlice = true;
    enableUserSlices = true;
  };
}
