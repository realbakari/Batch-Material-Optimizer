import PanelPlugin from 'LensStudio:PanelPlugin';
import * as Ui from 'LensStudio:Ui';

export class BatchMaterialOptimizer extends PanelPlugin {
    static descriptor() {
        return {
            id: 'com.bakari.batchmaterialoptimizer',
            name: 'Batch Material Optimizer',
            description: 'Batch select and modify imported materials to optimize rendering properties.',
            dependencies: [Ui.IGui, Editor.Model.IModel]
        };
    }

    constructor(pluginSystem) {
        super(pluginSystem);
        this.materials = [];
        this.checkboxes = [];
        this.connections = [];
    }

    getModelOrNull() {
        try {
            const hasEditor = (typeof Editor !== 'undefined') && Editor && Editor.Model && Editor.Model.IModel;
            if (!hasEditor) return null;
            return this.pluginSystem.findInterface(Editor.Model.IModel);
        } catch (e) {
            return null;
        }
    }

    // Load materials from Editor API
    loadMaterials() {
        const model = this.getModelOrNull();
        if (!model) {
            Ui.showMessageBox({ title: "Error", message: "Editor.Model.IModel is not available." });
            return;
        }

        const assetManager = model.project.assetManager;
        this.materials = assetManager.assets.filter(asset => asset.typeName === "Material");
        this.renderMaterialList();
    }

    renderMaterialList() {
        if (!this.scrollWidget) return;

        this.checkboxes = [];

        this.materials.forEach(mat => {
            const cb = new Ui.CheckBox(this.scrollWidget);
            cb.text = mat.displayName || mat.name || "Untitled Material";
            cb.checked = true;
            this.scrollLayout.addWidget(cb);

            this.checkboxes.push({
                checkbox: cb,
                material: mat
            });
        });

        if (this.statusLabel) {
            this.statusLabel.text = `Found ${this.materials.length} Materials.`;
        }
    }

    // Select or Deselect all boxes
    toggleAll(checked) {
        this.checkboxes.forEach(item => {
            item.checkbox.checked = checked;
        });
    }

    // Run property mutations safely
    applyMutation(mutationName, mutatorFunc) {
        let mutatedCount = 0;

        this.checkboxes.forEach(item => {
            if (item.checkbox.checked) {
                try {
                    mutatorFunc(item.material);
                    mutatedCount++;
                } catch (e) {
                    print(`Failed to mutate material ${item.material.displayName}: ${e}`);
                }
            }
        });

        if (this.statusLabel) {
            this.statusLabel.text = `Successfully modified ${mutatedCount} materials (${mutationName}).`;
        }
    }

    // Helper: create a section header label
    _addSectionHeader(parent, layout, text) {
        const label = new Ui.Label(parent);
        label.text = text;
        layout.addWidget(label);
    }

    // Helper: create a horizontal row of two buttons (Enable / Disable pattern)
    _addButtonPair(parent, layout, leftText, leftCallback, rightText, rightCallback) {
        const row = new Ui.Widget(parent);
        const rowLayout = new Ui.BoxLayout();
        rowLayout.setDirection(Ui.Direction.LeftToRight);
        row.layout = rowLayout;

        const leftBtn = new Ui.PushButton(row);
        leftBtn.text = leftText;
        this.connections.push(leftBtn.onClick.connect(leftCallback));
        rowLayout.addWidget(leftBtn);

        const rightBtn = new Ui.PushButton(row);
        rightBtn.text = rightText;
        this.connections.push(rightBtn.onClick.connect(rightCallback));
        rowLayout.addWidget(rightBtn);

        layout.addWidget(row);
    }

    createWidget(parentWidget) {
        const panel = new Ui.Widget(parentWidget);
        const mainLayout = new Ui.BoxLayout();
        mainLayout.setDirection(Ui.Direction.TopToBottom);
        mainLayout.setContentsMargins(Ui.Sizes.DialogContentMargin, Ui.Sizes.DialogContentMargin, Ui.Sizes.DialogContentMargin, Ui.Sizes.DialogContentMargin);
        mainLayout.spacing = Ui.Sizes.Padding;

        // ── Material Selection ──────────────────────────
        this._addSectionHeader(panel, mainLayout, "Material Selection");

        const refreshBtn = new Ui.PushButton(panel);
        refreshBtn.text = "Refresh Material List";
        this.connections.push(refreshBtn.onClick.connect(() => this.loadMaterials()));
        mainLayout.addWidget(refreshBtn);

        // Select All / Deselect All in a row
        this._addButtonPair(
            panel, mainLayout,
            "Select All", () => this.toggleAll(true),
            "Deselect All", () => this.toggleAll(false)
        );

        const listLabel = new Ui.Label(panel);
        listLabel.text = "Materials to optimize:";
        mainLayout.addWidget(listLabel);

        // Scroll Area
        this.scrollArea = new Ui.VerticalScrollArea(panel);
        this.scrollWidget = new Ui.Widget(this.scrollArea);
        this.scrollLayout = new Ui.BoxLayout();
        this.scrollLayout.setDirection(Ui.Direction.TopToBottom);
        this.scrollWidget.layout = this.scrollLayout;
        this.scrollArea.setWidget(this.scrollWidget);
        mainLayout.addWidget(this.scrollArea);

        // Initial Load
        this.loadMaterials();

        // ── Divider ─────────────────────────────────────
        mainLayout.addWidget(new Ui.Separator(Ui.Orientation.Horizontal, Ui.Shadow.Plain, panel));

        // ── Quick Actions ───────────────────────────────
        this._addSectionHeader(panel, mainLayout, "Quick Actions");

        // Depth Write
        const depthLabel = new Ui.Label(panel);
        depthLabel.text = "Depth Write";
        mainLayout.addWidget(depthLabel);
        this._addButtonPair(
            panel, mainLayout,
            "Enable", () => {
                this.applyMutation("Depth Write On", (mat) => {
                    if (mat.mainPass) mat.mainPass.depthWrite = true;
                });
            },
            "Disable", () => {
                this.applyMutation("Depth Write Off", (mat) => {
                    if (mat.mainPass) mat.mainPass.depthWrite = false;
                });
            }
        );

        // Two Sided
        const twoSidedLabel = new Ui.Label(panel);
        twoSidedLabel.text = "Two Sided";
        mainLayout.addWidget(twoSidedLabel);
        this._addButtonPair(
            panel, mainLayout,
            "Enable", () => {
                this.applyMutation("Two Sided On", (mat) => {
                    if (mat.mainPass) mat.mainPass.twoSided = true;
                });
            },
            "Disable", () => {
                this.applyMutation("Two Sided Off", (mat) => {
                    if (mat.mainPass) mat.mainPass.twoSided = false;
                });
            }
        );

        // Material Visibility
        const visLabel = new Ui.Label(panel);
        visLabel.text = "Material Visibility";
        mainLayout.addWidget(visLabel);
        this._addButtonPair(
            panel, mainLayout,
            "Show", () => {
                this.applyMutation("Visibility On", (mat) => {
                    if (mat.mainPass) mat.mainPass.colorMask = new vec4b(true, true, true, true);
                });
            },
            "Hide", () => {
                this.applyMutation("Visibility Off", (mat) => {
                    if (mat.mainPass) mat.mainPass.colorMask = new vec4b(false, false, false, false);
                });
            }
        );

        // ── Divider ─────────────────────────────────────
        mainLayout.addWidget(new Ui.Separator(Ui.Orientation.Horizontal, Ui.Shadow.Plain, panel));

        // ── Blend Mode ──────────────────────────────────
        this._addSectionHeader(panel, mainLayout, "Blend Mode");

        const blendNormalBtn = new Ui.PushButton(panel);
        blendNormalBtn.text = "Set Blend: Normal";
        this.connections.push(blendNormalBtn.onClick.connect(() => {
            this.applyMutation("Blend Normal", (mat) => {
                if (mat.mainPass) mat.mainPass.blendMode = 0;
            });
        }));
        mainLayout.addWidget(blendNormalBtn);

        // ── Divider ─────────────────────────────────────
        mainLayout.addWidget(new Ui.Separator(Ui.Orientation.Horizontal, Ui.Shadow.Plain, panel));

        // ── Status ──────────────────────────────────────
        this.statusLabel = new Ui.Label(panel);
        this.statusLabel.text = "Ready.";
        mainLayout.addWidget(this.statusLabel);

        mainLayout.addStretch(0);

        panel.layout = mainLayout;
        return panel;
    }
}
