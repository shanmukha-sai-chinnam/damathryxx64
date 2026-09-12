{pkgs, ...}: {
  devShell = pkgs.mkShell {
    name = "devops-devshell";

    packages = with pkgs; [
      # Cloud & AWS
      awscli2
      awsls
      eksctl
      amazon-ecr-credential-helper
      ssm-session-manager-plugin
      aws-vault

      # Infrastructure as Code
      terraform
      terraform-ls
      terragrunt
      packer

      # Containers & Kubernetes
      docker
      docker-compose
      kubectl
      kubectx
      kubernetes-helm
      k9s
      kustomize
      argocd
      stern
      skaffold

      # Observability & Config
      grafana-loki
      prometheus
      yq
      pre-commit

      # Python Cloud SDKs & Tools
      python312
      python312Packages.pip
      python312Packages.boto3
      python312Packages.ansible-core
      python312Packages.pytest
      python312Packages.black
      python312Packages.pylint
    ];

    shellHook = ''
      export AWS_PAGER=""
      export EDITOR="code -w"
      echo "DevOps devShell active (AWS, Terraform, Docker, Kubernetes)."
    '';
  };
}
