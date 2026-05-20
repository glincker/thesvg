class Thesvg < Formula
  desc "Browse and install brand SVG icons from theSVG (thesvg.org)"
  homepage "https://thesvg.org"
  url "https://registry.npmjs.org/@thesvg/cli/-/cli-0.5.4.tgz"
  sha256 "fa4f3d190348cce2010fbb70f996b46559889c6d98059f16c953b83526440a24"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "thesvg", shell_output("#{bin}/thesvg --help 2>&1", 0)
  end
end
