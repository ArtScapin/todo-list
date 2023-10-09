package br.csi.apitodolist.controller;

import br.csi.apitodolist.model.list.List;
import br.csi.apitodolist.model.list.ListData;
import br.csi.apitodolist.model.workspace.Workspace;
import br.csi.apitodolist.service.ListService;
import br.csi.apitodolist.service.WorkspaceService;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/list")
public class ListController {
    private final ListService service;
    private final WorkspaceService workspaceService;

    public ListController(ListService service, WorkspaceService workspaceService) {
        this.service = service;
        this.workspaceService = workspaceService;
    }

    @PostMapping("/{id}")
    @Transactional
    public ResponseEntity<ListData> store(@PathVariable Long id, @RequestBody List list) {
        Workspace workspace = workspaceService.findWorkspace(id);
        if (workspace != null) {
            list.setWorkspace(workspace);
            list.setStatus(true);
            this.service.create(list);
            return ResponseEntity.status(201).body(new ListData(list));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ListData> update(@PathVariable Long id, @RequestBody List list) {
        return ResponseEntity.status(201).body(new ListData(this.service.update(list, id)));
    }

    @GetMapping("/all/{id}")
    public ResponseEntity<java.util.List<ListData>> findListsByWorkspace(@PathVariable Long id) {
        Workspace workspace = workspaceService.findWorkspace(id);
        return ResponseEntity.status(200).body(this.service.findListsByWorkspace(workspace.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListData> findById(@PathVariable Long id){
        return ResponseEntity.status(200).body(new ListData(this.service.findList(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity deleteById(@PathVariable Long id){
        this.service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
