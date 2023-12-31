package br.csi.apitodolist.controller;

import br.csi.apitodolist.model.workspace.Workspace;
import br.csi.apitodolist.service.UserService;
import br.csi.apitodolist.service.WorkspaceService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/workspace")
public class WorkspaceController  {
    private final WorkspaceService service;
    private final UserService userService;

    public WorkspaceController(WorkspaceService service, UserService userService) {
        this.service = service;
        this.userService = userService;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Workspace> store(@RequestBody @Valid Workspace workspace) {
        workspace.setUser(this.userService.getAuthenticatedUser());
        this.service.create(workspace);
        return ResponseEntity.status(201).body(workspace);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Workspace> update(@PathVariable Long id, @RequestBody @Valid Workspace workspace) {
        return ResponseEntity.status(200).body(this.service.update(workspace, id));
    }

    @GetMapping
    public ResponseEntity<List<Workspace>> findMyWorkspaces() {
        return ResponseEntity.status(200).body(this.service.findMyWorkspaces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Workspace> findById(@PathVariable Long id){
        return ResponseEntity.status(200).body(this.service.findWorkspace(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity deleteById(@PathVariable Long id){
        this.service.deleteWorkspace(id);
        return ResponseEntity.noContent().build();
    }
}
